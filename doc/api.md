# API reference

Complete reference for the `@seneca/provider` plugin exports, messages
and helper functions. For the options each function accepts, see
[options.md](options.md). For why the API is shaped this way, see
[concepts.md](concepts.md).

All signatures below are as implemented in `src/provider.ts`.


## Registration

```js
Seneca()
  .use('promisify')
  .use('entity')
  .use('provider', options)
```

`seneca-entity` and `seneca-promisify` are peer dependencies and must
be registered before any provider plugin that uses entities.
`@seneca/env` is optional; when present its `env/injectVars` export is
used to resolve `$NAME` references in key values.


## Plugin exports

| Export | Description |
|---|---|
| `provider/entityBuilder` | Generate entity message patterns from a spec. |
| `provider/makeUtils` | Build HTTP helpers bound to one API. |

Retrieve them with `seneca.export()`:

```js
const entityBuilder = seneca.export('provider/entityBuilder')
const makeUtils = seneca.export('provider/makeUtils')
```


## `entityBuilder(seneca, spec)`

Generates and registers one Seneca message per entity command.

- `seneca` — the Seneca instance to register the messages on. Inside a
  plugin definition function this is `this`.
- `spec` — the entity specification, described below.

Returns `undefined`. The spec is validated on entry; an invalid spec
throws a Seneca validation error.

### Spec shape

```js
{
  provider: {
    name: String,        // required
  },
  entity: {
    <entity-name>: {
      cmd: {
        <cmd-name>: {
          action: Function,   // required
        }
      }
    }
  }
}
```

`<cmd-name>` must be one of `list`, `load`, `save`, `remove`. Any
other name throws `TypeError: cmdBuilder[cmdname] is not a function`
— the spec validator does not catch this, so the failure surfaces at
build time with an unhelpful message.

Both `entity` and `cmd` accept any number of children.

### Generated patterns

For each command, the registered pattern is:

```js
{
  cmd:  <cmd-name>,
  zone: 'provider',
  base: <spec.provider.name>,
  name: <entity-name>,
  ...options.entity.pin      // default: { sys: 'entity' }
}
```

So `provider.name = 'foo'` with entity `bar` and cmd `list` yields:

```js
{ cmd: 'list', zone: 'provider', base: 'foo', name: 'bar', sys: 'entity' }
```

which is reachable as the entity canon `provider/foo/bar`:

```js
await seneca.entity('provider/foo/bar').list$()
```

### Action signature

```js
async function action(entize, msg, meta) { ... }
```

- `this` — the Seneca instance handling the message.
- `entize` — the conversion function, bound to this entity's canon.
- `msg` — the inbound message. For `load`/`list`, the caller's query
  is `msg.q`.
- `meta` — Seneca message metadata.

The returned value becomes the message response. Return an entity (via
`entize`) for `load`/`save`, an array of entities for `list`.

The generated action's `Function.name` is set to
`<cmd-name>_<entity-name>` to aid debugging.


## `entize(data, modifyspec?)`

Converts between plain data and Seneca entities. Direction is chosen
from the input:

- **Plain object in** → returns an entity of this action's canon.
- **Entity in** → returns plain data (`data$(false)`).

`modifyspec` is applied before conversion. It is optional:

```js
entize(res, { field: { y: { src: 'x' } } })
```

copies `data.x` to `data.y`. See
[options.md](options.md#modify-spec) for the full shape.

`entize` mutates the object it is given when a modify spec is
supplied.


## `makeUtils(utilopts)`

Builds a set of HTTP helpers bound to a single API. Call once per
provider, at plugin definition time. See
[options.md](options.md#makeutils-options) for `utilopts`.

Returns:

| Member | Description |
|---|---|
| `makeUrl(suffix, q?)` | Build a URL against the base `url`. |
| `get(url, config?)` | GET, returns parsed JSON. |
| `post(url, config)` | POST, returns parsed JSON. |
| `delete(url, config?)` | DELETE, returns parsed JSON. |
| `getJSON` | Alias of `get` (identical reference). |
| `postJSON` | Alias of `post`. |
| `deleteJSON` | Alias of `delete`. |
| `fetcher` | The retry-wrapped fetch used by the helpers. |
| `origFetcher` | The underlying fetch, without retry wrapping. |
| `fetchRetry` | The `FetchRetry` constructor itself. |
| `asyncLocalStorage` | Per-request config store. |
| `entityBuilder` | The same function as the plugin export. |

### `makeUrl(suffix, q?)`

Concatenates `utilopts.url + suffix`, then applies `q`:

| `q` | Result |
|---|---|
| omitted / falsy | `url + suffix` |
| a string | `url + suffix + '/' + encodeURIComponent(q)` |
| an object with keys | `url + suffix + '?' + URLSearchParams(q)` |
| an empty object | `url + suffix` |

Given base `http://x/`:

```js
makeUrl('a')                    // 'http://x/a'
makeUrl('a', 'b c')             // 'http://x/a/b%20c'
makeUrl('a', { p: 1, q: 'x y' }) // 'http://x/a?p=1&q=x+y'
makeUrl('a', {})                // 'http://x/a'
```

### `get(url, config?)` / `getJSON`

Performs the request and returns the parsed JSON body.

Request config is `deep(sharedConfig, config)` — **the per-call
`config` wins** over the `config` given to `makeUtils`.

Succeeds only on status **exactly 200**. Every other status, including
`201` and `204`, throws.

### `post(url, config)` / `postJSON`

Request config is
`deep({ method: 'post', headers: { 'Content-Type': 'application/json' } }, config || {}, sharedConfig)`
— **the shared `config` wins** over the per-call `config`. This is the
opposite precedence to `get`; see
[concepts.md](concepts.md#configuration-layering).

The body is taken from `config.body`: used as-is if a string,
otherwise `JSON.stringify`-ed. `config` is therefore **not optional in
practice** — calling `post(url)` throws
`TypeError: Cannot read properties of undefined (reading 'body')`.

Succeeds on any status in the range `200 <= status < 300`.

Set `method: 'PUT'` in `config` to issue a PUT instead.

### `delete(url, config?)` / `deleteJSON`

As `post`, but defaults `method` to `'delete'` and does not set a
body. Same config precedence as `post`, same `2xx` success range.

### Error shape

All three helpers throw a plain `Error` on failure:

```js
err.message           // 'Provider <name> <status>'
err.provider.response // the fetch Response object
err.provider.options  // the *plugin* options, not utilopts
err.provider.config   // the per-call config as passed in
err.provider.body     // parsed JSON, or text if not JSON
```

`err.provider.body` is set by `post` and `delete` only — `get` does
**not** attach it.

### `asyncLocalStorage`

An `AsyncLocalStorage` instance holding `{ config }` for the
in-flight request. Read it from inside a `retryOn` callback to mutate
the config of the request that is about to be retried:

```js
const store = asyncLocalStorage.getStore()
store.config.headers['Authorization'] = 'Bearer ' + freshToken
```

This is the mechanism behind the token-refresh recipe in
[guide.md](guide.md#refresh-an-expired-access-token).


## Messages

All messages are on the `sys:provider` pin and are added by the plugin
itself, independent of any provider you build.

### `sys:provider,get:key`

Get one key value.

| Param | Type | Description |
|---|---|---|
| `provider` | string | Provider name. |
| `key` | string | Key name. |

```js
{ ok: true, value: 'the-key-value' }
{ ok: false, why: 'unknown-provider' }
{ ok: false, why: 'unknown-key' }
```

### `sys:provider,get:keymap`

Get all key descriptors for a provider, as a deep copy.

| Param | Type | Description |
|---|---|---|
| `provider` | string | Provider name. |

```js
{ ok: true, keymap: { main: { value: 'KEY' } } }
{ ok: false, why: 'unknown-provider' }
```

### `sys:provider,list:provider`

List all configured providers and their key names. Takes no
parameters and never fails.

```js
{
  ok: true,
  list: [
    { name: 'foo', keys: ['red', 'green'] },
    { name: 'bar', keys: ['red', 'blue'] },
  ]
}
```


## `provider.intern`

Internal functions exposed for testing. Not part of the supported API
and subject to change without a major version bump.

| Function | Signature |
|---|---|
| `makePattern` | `(cmdspec, entspec, spec, options)` |
| `makeAction` | `(cmdspec, entspec, spec)` |
| `makeEntize` | `(seneca, canon)` |
| `applyModifySpec` | `(data, spec?)` |
