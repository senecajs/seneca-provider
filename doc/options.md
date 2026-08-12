# Options reference

Every option accepted by the plugin and by its helper functions.
Defaults are as declared in `src/provider.ts`.


## Plugin options

Passed when registering the plugin:

```js
Seneca().use('provider', {
  provider: { ... },
  entity: { pin: { ... } },
})
```

### `provider`

- **Type:** `Record<string, Provider>`
- **Default:** `{}`

A map of provider name to provider descriptor. The map key is copied
onto the descriptor as `name`, so you do not set it yourself.

```js
provider: {
  github: {
    keys: {
      main: { value: 'ghp_xxx' },
    }
  }
}
```

#### `provider.<name>.keys`

- **Type:** `Record<string, { value: string }>`

Named secrets for that provider. Each descriptor currently carries a
single field, `value`. The extra nesting exists so descriptors can
grow more fields without breaking callers.

Key values support `$NAME` environment references when `@seneca/env`
is registered — see [Environment injection](#environment-injection).

### `entity.pin`

- **Type:** `Record<string, string | number | boolean | null>`
- **Default:** `{ sys: 'entity' }`

Merged into every message pattern that `entityBuilder` generates. The
default makes generated patterns entity messages, which is what routes
`entity('provider/x/y').load$()` to your action.

Overriding this is an advanced operation. Setting it to `{}` removes
`sys:entity` and the generated messages will no longer be reachable
through the entity API.


## Environment injection

When `@seneca/env` is registered before `provider`, the plugin calls
its `env/injectVars` export on each provider descriptor at
registration time. Any key value of the form `$NAME` is replaced by
the value of the environment variable `NAME`.

```js
Seneca()
  .use('env', {
    var: {
      GITHUB_TOKEN: String,
    }
  })
  .use('provider', {
    provider: {
      github: {
        keys: {
          main: { value: '$GITHUB_TOKEN' },
        }
      }
    }
  })
```

If `@seneca/env` is not registered, values are used verbatim and a
`$NAME` string stays a literal `$NAME`.


## `makeUtils` options

Passed when building the helpers for one API:

```js
const utils = seneca.export('provider/makeUtils')({
  name: 'github',
  url: 'https://api.github.com/',
  config: { headers: {} },
  retry: { config: { retryOn: [500] } },
})
```

### `name`

- **Type:** `string`
- **Default:** `''`

Identifies the provider in thrown errors, which take the form
`Provider <name> <status>`. Not otherwise used.

### `url`

- **Type:** `string`

Base URL. `makeUrl` concatenates directly onto it with no separator
inserted, so include the trailing `/` if you want one.

### `config`

- **Type:** `Record<string, any>`
- **Default:** `{}`

A fetch config merged into every request made by these helpers.
Typically holds `headers`.

Precedence differs by method — see
[concepts.md](concepts.md#configuration-layering):

| Helper | Merge order | Winner |
|---|---|---|
| `get` | `deep(config, callConfig)` | per-call config |
| `post` | `deep(defaults, callConfig, config)` | shared config |
| `delete` | `deep(defaults, callConfig, config)` | shared config |

The object is held by reference, so mutating it after `makeUtils`
returns affects subsequent requests. This is deliberate and is how the
token-refresh recipe works.

### `fetch`

- **Type:** `function`
- **Default:** `globalThis.fetch`, else `require('node-fetch')`

Only consulted when `globalThis.fetch` is undefined. On Node 24
`globalThis.fetch` is always present, so this option and the
`node-fetch` peer dependency are effectively dead on supported
runtimes. Retained for older embedders.

### `debug`

- **Type:** `boolean`

Declared in the `ProviderUtilityOptions` type but **never read** by
the implementation. Setting it has no effect.

### `retry`

- **Type:** `boolean | { config: RetryConfig }`
- **Default:** none (no retry wrapping)

| Value | Effect |
|---|---|
| omitted / falsy | No retries. |
| `true` | Retry with all defaults. |
| `{ config: {...} }` | Retry with the given config. |


## Retry config

Supplied as `retry.config`. The implementation is a vendored copy of
[`fetch-retry`](https://github.com/jonbern/fetch-retry) (MIT, Jon K.
Bernhardsen).

### `retries`

- **Type:** positive integer
- **Default:** `3`

Maximum retry attempts. **Ignored when `retryOn` is a function** — a
function has sole control over whether to continue.

### `retryDelay`

- **Type:** positive integer, or `(attempt, error, response) => number`
- **Default:** `1000`

Milliseconds to wait before the next attempt.

### `retryOn`

- **Type:** array of status codes, or
  `(attempt, error, response, { resource, options }) => boolean | Promise<boolean>`
- **Default:** `[]`

As an **array**: retry when the response status is in the list, up to
`retries` attempts. A status not in the list resolves immediately.

As a **function**: called for every response *and* every network
error. Return truthy to retry, falsy to resolve/reject as-is. It may
be async, which is what makes token refresh possible. Because
`retries` no longer applies, the function must impose its own ceiling:

```js
retryOn: async function (attempt, error, response) {
  if (4 <= attempt) return false
  // ...
}
```

Omitting that guard gives an unbounded retry loop.

### Per-request overrides

`retries`, `retryDelay` and `retryOn` may also be set on an individual
request's config, where they override the `retry.config` defaults for
that request only:

```js
await getJSON(url, { retries: 5, retryDelay: 250 })
```

Invalid values throw at request time.


## Modify spec

Accepted as the second argument to `entize`.

```js
{
  field: {
    <target-field>: { src: <source-field> }
  }
}
```

For each entry, `data[target] = data[src]`. Copy is the only operation
currently implemented. The input object is mutated in place.

```js
applyModifySpec({ x: 1 }, { field: { y: { src: 'x' } } })
// { x: 1, y: 1 }
```
