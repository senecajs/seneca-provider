# Tutorial: build your first provider plugin

This tutorial walks you through wrapping a third-party HTTP API as a
Seneca plugin, end to end. By the end you will have a working
`repohome` provider that loads GitHub repository data as a Seneca
entity.

You need Node.js 24 or later. Everything here runs against the live
public GitHub API, so no credentials are required.

This is a learning path, not a reference — it shows one way through,
not every option. When you want the full list of what each function
accepts, read [options.md](options.md) and [api.md](api.md).


## Step 1: install

Create a folder and install the plugin along with the Seneca packages
it works with:

```sh
$ npm install seneca seneca-promisify seneca-entity @seneca/provider
```

`seneca-entity` gives you the entity API that provider plugins expose
their data through. `seneca-promisify` gives you `await`-able
messages. Both are peer dependencies of `@seneca/provider`.


## Step 2: start Seneca with the provider plugin

Create `repohome.js`:

```js
const Seneca = require('seneca')

const seneca = Seneca({ legacy: false })
  .use('promisify')
  .use('entity')
  .use('provider')

seneca.ready(() => {
  console.log('ready')
})
```

Run it:

```sh
$ node repohome.js
ready
```

Nothing visible happens yet. `@seneca/provider` on its own only adds
the `sys:provider` messages for key management. The useful part is the
two functions it exports for building your own plugin.


## Step 3: create the utilities for your API

`@seneca/provider` exports a function called `makeUtils`. You call it
once with the name and base URL of the API you are wrapping, and it
returns a set of HTTP helpers bound to that API.

Add a plugin function to `repohome.js`:

```js
function RepohomeProvider() {
  const seneca = this

  const { makeUrl, getJSON } = seneca.export('provider/makeUtils')({
    name: 'repohome',
    url: 'https://api.github.com/repos/senecajs/',
  })
}
```

`makeUrl` builds URLs against that base. `getJSON` performs a GET and
returns the parsed JSON body, throwing an error for any non-200
response.


## Step 4: define an entity and a command

Now describe the data. A provider entity is identified by a *canon* of
three parts — `provider/<provider-name>/<entity-name>`. You declare
the entity and which commands it supports, and `entityBuilder`
generates the Seneca message patterns for you.

Extend the plugin function:

```js
function RepohomeProvider() {
  const seneca = this

  const entityBuilder = seneca.export('provider/entityBuilder')

  const { makeUrl, getJSON } = seneca.export('provider/makeUtils')({
    name: 'repohome',
    url: 'https://api.github.com/repos/senecajs/',
  })

  entityBuilder(seneca, {
    provider: {
      name: 'repohome',
    },
    entity: {
      readme: {
        cmd: {
          load: {
            action: async function (entize, msg) {
              const res = await getJSON(makeUrl(msg.q.id))

              let load = entize(res)
              load.id = msg.q.id

              return load
            },
          },
        },
      },
    },
  })
}
```

Three things are worth noticing:

- Your `action` receives `entize` as its **first** argument, then the
  message. `entize` converts a plain JSON object into a Seneca entity
  of the right canon.
- `msg.q` holds the query. For a `load`, `msg.q.id` is the id passed
  by the caller.
- You set `load.id` yourself. The provider does not guess which API
  field is the identifier.

Register the plugin:

```js
const seneca = Seneca({ legacy: false })
  .use('promisify')
  .use('entity')
  .use('provider')
  .use(RepohomeProvider)
```


## Step 5: load a repository

Replace the `seneca.ready` block:

```js
seneca.ready(async function () {
  const repo = await this.entity('provider/repohome/readme')
    .load$('seneca-provider')

  console.log(repo.id, repo.full_name)
})
```

Run it:

```sh
$ node repohome.js
seneca-provider senecajs/seneca-provider
```

You now have a working provider. The `load$` call was routed to your
action, which fetched
`https://api.github.com/repos/senecajs/seneca-provider`, and the JSON
came back wrapped as an entity.


## Step 6: see what happens when the API fails

Ask for a repository that does not exist:

```js
try {
  await this.entity('provider/repohome/readme').load$('not-a-repo')
} catch (err) {
  console.log(err.message)
  console.log(err.provider.response.status)
}
```

```
Provider repohome 404
404
```

`getJSON` throws for any status other than 200, and attaches the
original response under `err.provider`. The provider name you passed to
`makeUtils` is what makes the message identifiable.


## Step 7: add a key

Real APIs need credentials. Provider keys are declared as plugin
options, and read back through the `sys:provider` messages.

Change the plugin registration:

```js
.use('provider', {
  provider: {
    repohome: {
      keys: {
        token: { value: 'a-github-token' },
      },
    },
  },
})
```

Read the key inside your plugin and send it as a header:

```js
function RepohomeProvider() {
  const seneca = this
  const entityBuilder = seneca.export('provider/entityBuilder')

  const config = { headers: {} }

  const { makeUrl, getJSON } = seneca.export('provider/makeUtils')({
    name: 'repohome',
    url: 'https://api.github.com/repos/senecajs/',
    config,
  })

  seneca.prepare(async function () {
    const key = await this.post('sys:provider,get:key', {
      provider: 'repohome',
      key: 'token',
    })
    config.headers.Authorization = 'Bearer ' + key.value
  })

  // ... entityBuilder call as before
}
```

The `config` object you pass to `makeUtils` is merged into every
request that helper makes, so filling it in during `prepare` is enough
to authenticate every later call.

Hard-coding the token is fine for a tutorial and wrong for real code.
[The guide](guide.md#keep-secrets-out-of-source-with-senecaenv) shows
how to pull it from an environment variable instead.


## Where to go next

- [guide.md](guide.md) — recipes for retries, token refresh, query
  parameters, writes, and testing.
- [concepts.md](concepts.md) — why the canon, `entize`, and the
  config-layering design work the way they do.
- [api.md](api.md) and [options.md](options.md) — the complete
  reference.
