# Guide: how-to recipes

Task-focused recipes for building a provider plugin. Each is
self-contained; read the one you need. If you are starting from
nothing, work through [tutorial.md](tutorial.md) first.


## Keep secrets out of source with @seneca/env

Register `@seneca/env` **before** `provider` and reference variables
with `$NAME`:

```js
Seneca({ legacy: false })
  .use('promisify')
  .use('entity')
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

Substitution happens once, when the provider plugin is registered.
Order matters: if `env` is registered after `provider`, the
`env/injectVars` export is not yet available and `$GITHUB_TOKEN`
stays a literal string.

`@seneca/env` can also read from a JSON file, which is convenient for
tests:

```js
.use('env', {
  file: __dirname + '/env.json',
  var: { FOO: String, BAR: String },
})
```


## Read a key from inside your plugin

Keys live in the provider plugin, not in yours. Ask for them by
message:

```js
const keyspec = await seneca.post('sys:provider,get:key', {
  provider: 'github',
  key: 'main',
})

if (!keyspec.ok) {
  throw new Error('no github key: ' + keyspec.why)
}

config.headers.Authorization = 'Bearer ' + keyspec.value
```

Always check `ok` — an unknown provider or key resolves with
`{ ok: false, why }` rather than throwing.

To fetch every key at once, use `get:keymap`, which returns a deep
copy you can mutate freely.


## Send query parameters

Pass an object as the second argument to `makeUrl`:

```js
const res = await getJSON(makeUrl('repos', { per_page: 100, page: 2 }))
// https://api.example.com/repos?per_page=100&page=2
```

Pass a string to append a path segment instead — it is URL-encoded for
you:

```js
makeUrl('repos', 'my repo')   // .../repos/my%20repo
```

An empty object adds nothing, so you can pass `msg.q` directly without
guarding it.


## Write data: save and remove

`save` and `remove` are entity commands like `load` and `list`:

```js
entityBuilder(seneca, {
  provider: { name: 'api' },
  entity: {
    widget: {
      cmd: {
        save: {
          action: async function (entize, msg) {
            const body = msg.ent.data$(false)
            const res = await postJSON(makeUrl('widget'), { body })
            return entize(res)
          }
        },
        remove: {
          action: async function (entize, msg) {
            await deleteJSON(makeUrl('widget', msg.q.id))
            return null
          }
        },
      }
    }
  }
})
```

For `save`, the entity being saved is `msg.ent`. Calling
`.data$(false)` gives you its plain data without entity metadata.

`postJSON` requires a config object — `postJSON(url)` with no second
argument throws. Pass at least `{ body }`.

For PUT, set the method explicitly:

```js
await postJSON(url, { method: 'PUT', body })
```


## Reshape API fields onto entity fields

When the API's field names do not match the ones you want to expose,
pass a modify spec to `entize`:

```js
const res = await getJSON(makeUrl(msg.q.id))

return entize(res, {
  field: {
    id: { src: 'uuid' },
    name: { src: 'display_name' },
  }
})
```

Copy is the only operation available. For anything else — renames that
drop the original, computed fields, type coercion — transform the
object yourself before calling `entize`.


## Retry failed requests

For a fixed set of retryable statuses, an array is enough:

```js
const { makeUrl, getJSON } = seneca.export('provider/makeUtils')({
  name: 'api',
  url: 'https://api.example.com/',
  retry: {
    config: {
      retryDelay: 100,
      retryOn: [500, 502, 503],
    }
  }
})
```

That retries up to `retries` times (default 3) whenever the status is
in the list.

To vary the delay, pass a function:

```js
retryDelay: (attempt) => Math.pow(2, attempt) * 100
```


## Refresh an expired access token

This is the reason `retryOn` may be a function and why
`asyncLocalStorage` is exported. The sequence is: a request comes back
`401`, the `retryOn` callback obtains a fresh token, writes it into
the config of the pending request, and returns `true` to retry it.

```js
function ApiProvider() {
  const seneca = this
  const config = { headers: {} }
  const reqSeneca = seneca.root.delegate()
  let refreshToken = null

  const { makeUrl, getJSON, origFetcher, asyncLocalStorage } =
    seneca.export('provider/makeUtils')({
      name: 'api',
      url: 'https://api.example.com/entity/',
      config,
      retry: {
        config: {
          retryDelay: 100,
          retryOn: async function (attempt, _error, response) {
            if (4 <= attempt) return false
            if (500 <= response.status && attempt <= 3) return true

            if (401 === response.status) {
              if (null == refreshToken) {
                const keyspec = await reqSeneca.post(
                  'sys:provider,get:key,provider:api,key:main')

                const res = await origFetcher(
                  'https://api.example.com/token/refresh',
                  { headers: { 'x-sp-key': keyspec.value } })

                refreshToken = (await res.json()).refresh
                return true
              }

              const res = await origFetcher(
                'https://api.example.com/token/access',
                { headers: { 'x-sp-refresh': refreshToken } })

              if (401 === res.status) {
                refreshToken = null
                return true
              }

              const access = (await res.json()).access

              // the in-flight request
              asyncLocalStorage.getStore().config.headers['x-sp-access'] = access
              // every later request
              config.headers['x-sp-access'] = access

              return true
            }
          }
        }
      }
    })
}
```

Four details make this work:

- **`origFetcher`, not `getJSON`.** The token endpoints must not go
  through the retry wrapper, or a failing refresh recurses.
- **Both writes are needed.** `asyncLocalStorage.getStore().config` is
  the config of the request being retried right now; the shared
  `config` object fixes every subsequent request. Updating only the
  latter leaves the pending retry using the stale token.
- **`seneca.root.delegate()`.** Messages sent from inside a retry
  callback are outside the original message's context; a root delegate
  avoids inheriting it.
- **The `attempt` ceiling.** With a function `retryOn`, `retries` is
  ignored. Without the `if (4 <= attempt) return false` guard this
  loops forever.

`test/api.test.js` exercises this whole flow against a local server.


## Handle provider errors

Failures throw, so use `try`/`catch` or let the error propagate as the
message error:

```js
try {
  return entize(await getJSON(makeUrl(msg.q.id)))
} catch (err) {
  if (404 === err.provider?.response.status) {
    return null      // not-found is not an error for `load`
  }
  throw err
}
```

Two things to watch:

- `getJSON` treats **only** status 200 as success. An API that returns
  `204 No Content` on an empty result throws.
- `err.provider.body` is populated by `postJSON` and `deleteJSON` but
  **not** by `getJSON`. For GET failures, read the body from
  `err.provider.response` yourself.


## Change the generated message patterns

Every generated pattern is merged with `options.entity.pin`, which
defaults to `{ sys: 'entity' }`. To add your own discriminator:

```js
.use('provider', {
  entity: {
    pin: { sys: 'entity', tier: 'external' }
  }
})
```

Do not remove `sys: 'entity'` unless you intend the messages to stop
being reachable through the entity API.


## Test a provider plugin

Run a local HTTP server as a fixture and point the provider at it.
This repo's own tests are a working model:

- `test/api-server.js` — an Express server with deterministic state,
  so retry and refresh sequences are reproducible.
- `test/api.test.js` — starts it in `before`, closes it in `after`.
- `test/provider.test.js` — covers the `sys:provider` messages, and
  uses `seneca-msg-test` with a spec in `test/provider.messages.ts`.

The shape:

```js
const { describe, test, before, after } = require('node:test')
const assert = require('node:assert')

describe('api', () => {
  let server = null
  before(async () => { server = makeApiServer() })
  after(async () => { server.close() })

  test('load', async () => {
    const s0 = Seneca({ legacy: false }).test()
      .use('promisify').use('entity').use(Provider).use(MyProvider)

    const out = await s0.entity('provider/api/foo').load$('0')
    assert.partialDeepStrictEqual(out, { id: '0', kind: 'foo' })
  })
})
```

`assert.partialDeepStrictEqual` is the node:test equivalent of a
subset match, which is usually what you want against a live-ish API
response.

See [develop.md](develop.md) for how to run the suite.
