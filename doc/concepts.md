# Concepts

Why `@seneca/provider` is built the way it is. This is background
reading — nothing here is needed to *use* the plugin, but it explains
the shape of the API and the trade-offs behind it.


## The problem

A Seneca system that talks to third-party APIs accumulates the same
code in every integration: build a URL, attach credentials, parse
JSON, decide what counts as an error, retry the flaky calls, refresh
the expired token. Written once per API, this drifts — each
integration handles failure slightly differently, and none of them can
be swapped for a mock without knowing its internals.

`@seneca/provider` factors out the parts that do not vary. It is not a
client for any particular API; it is the scaffolding that individual
provider plugins (`@seneca/github-provider`, `@seneca/trello-provider`
and the rest) are built on.

The plugin therefore does two quite different jobs, which is worth
knowing up front:

1. **Key custody** — it holds provider credentials and hands them out
   over the `sys:provider` messages.
2. **Plugin construction** — it exports `entityBuilder` and
   `makeUtils` for other plugins to build themselves with.

Only the first is a running service. The second is a toolkit.


## Remote data as entities

The central decision is that a remote API resource is modelled as a
Seneca entity, under a three-part canon:

```
provider/<provider-name>/<entity-name>
```

So a GitHub repository is `provider/github/repo`, and you load it the
same way you load anything else:

```js
await seneca.entity('provider/github/repo').load$('seneca-provider')
```

The payoff is uniformity. Calling code does not need to know whether
data is local or remote, and the `zone: 'provider'` prefix keeps the
namespace from colliding with your own entities. Existing entity
tooling — patterns, delegation, message capture in tests — works
unchanged.

The cost is that the entity vocabulary is narrow. Only four commands
exist (`list`, `load`, `save`, `remove`), because those are what the
entity API defines. An API operation that is not one of those four —
"archive", "invite", "publish" — has no natural home, and you fall
back to defining an ordinary Seneca message alongside. Attempting to
add a fifth command name to a spec fails with a raw `TypeError`
against the internal command table.


## `entize` and the two directions

`entize` looks odd on first contact: one function that converts data
to an entity *and* entities back to data, choosing by inspecting its
argument. The alternative — two functions — would push the choice onto
every caller, and in practice a provider action almost always knows
which way it is going.

The direction test is structural: an argument with a string `entity$`
and a callable `data$` is treated as an entity. This is duck-typing,
so a plain object that happens to have those fields will be
misclassified.

`entize` is also where the modify spec is applied, which is why field
copying is available on both directions of the conversion.


## Configuration layering

Three layers of fetch config combine on every request:

1. The method defaults (`method`, `Content-Type`) — `post`/`delete`
   only.
2. The **shared** config passed to `makeUtils`.
3. The **per-call** config passed to the individual helper.

The shared config is held by reference, deliberately. Mutating it
later changes every subsequent request, which is what makes the
token-refresh pattern possible without threading a token through every
call site.

**The precedence between layers 2 and 3 is not consistent:**

| Helper | Merge | Winner |
|---|---|---|
| `get` | `deep(shared, call)` | per-call |
| `post` | `deep(defaults, call, shared)` | shared |
| `delete` | `deep(defaults, call, shared)` | shared |

`get` lets an individual call override the shared config; `post` and
`delete` do not. This is a genuine inconsistency in the
implementation rather than a considered design, and it is easy to trip
over: passing `{ headers: { Authorization: ... } }` to `postJSON`
silently loses to a shared `Authorization` header. Until it is fixed,
treat per-call config as advisory for writes and set what you need on
the shared object.

Fixing it would be a breaking change for any provider that has come to
depend on the current behaviour, which is why it is documented rather
than quietly corrected.


## Retry, and why `retryOn` may be a function

Retrying on a status code is simple enough to express as a list, and
that is the common case. Token refresh is not: it needs to perform I/O
between the failure and the retry, and then modify the request that is
about to be re-sent.

That is why `retryOn` also accepts an async function, and why the
in-flight request's config is exposed through `AsyncLocalStorage`.
`AsyncLocalStorage` is the right tool here because the retry callback
runs deep inside the fetch wrapper, with no parameter linking it back
to the call that started it — but it is in the same async context.

Two consequences follow, both sharp:

- A function `retryOn` **disables the `retries` ceiling** entirely. The
  function is the sole authority on whether to continue, so it must
  impose its own bound or loop forever.
- Refresh requests must use `origFetcher`, the un-wrapped fetch.
  Issuing them through the retry-wrapped `fetcher` means a failing
  refresh triggers its own refresh.

The retry implementation is a vendored copy of
[`fetch-retry`](https://github.com/jonbern/fetch-retry) (MIT), inlined
rather than depended on. That keeps the dependency footprint at zero
runtime packages, at the cost of not picking up upstream fixes.


## Keys as messages

Credentials are declared as plugin options and read back over
messages, rather than being handed to provider plugins directly.

The indirection buys two things. Provider plugins never hold a key at
definition time, so a key can be resolved lazily, after startup, when
a vault or environment is ready. And the `sys:provider` messages are a
seam: they can be intercepted, mocked in tests, or re-implemented
against a real secret store without touching any provider plugin.

Environment substitution is a thin layer on top — when `@seneca/env`
is present, `$NAME` values are resolved once, at registration. It is
optional by design, so the plugin has no hard dependency on a
particular configuration mechanism.

The `keys: { main: { value: 'x' } }` nesting looks redundant for a
single field. It exists so key descriptors can carry more metadata —
expiry, scope, rotation state — without changing the shape callers
already handle.


## What this plugin is not

- **Not an HTTP client.** `makeUtils` is a thin wrapper over `fetch`.
  Anything beyond URL building, JSON parsing, error wrapping and retry
  belongs in your provider plugin.
- **Not a cache.** Every `load$` is a live request.
- **Not a rate limiter.** Retry will happily amplify load against an
  API that is failing.
- **Not a schema layer.** Beyond field copying via the modify spec,
  responses reach your entity as the API returned them.


## Known rough edges

Collected here so they are findable, and cross-referenced from the
reference docs where they bite:

- `get` accepts **only** HTTP 200 as success; `201` and `204` throw.
  `post` and `delete` accept any `2xx`.
- `post(url)` without a config argument throws a `TypeError` while
  reading `config.body`, despite the parameter being optional in the
  type.
- `err.provider.body` is attached by `post` and `delete`, but not by
  `get`.
- `err.provider.options` is the **plugin** options object, not the
  `makeUtils` options — a naming collision that reads the wrong way.
- The `debug` option is declared in `ProviderUtilityOptions` and never
  read.
- The `fetch` option and the `node-fetch` peer dependency are dead
  weight on Node 18+, where `globalThis.fetch` always exists.
- An unrecognised command name in an entity spec throws
  `TypeError: cmdBuilder[cmdname] is not a function` rather than a
  validation error.
