![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/provider

[![npm version](https://img.shields.io/npm/v/@seneca/provider.svg)](https://npmjs.com/package/@seneca/provider)
[![build](https://github.com/senecajs/seneca-provider/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-provider/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-provider/badge.svg)](https://snyk.io/test/github/senecajs/seneca-provider)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/19459/branches/505694/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=19459&bid=505694)
[![Maintainability](https://api.codeclimate.com/v1/badges/ee603417bbb953d35ebe/maintainability)](https://codeclimate.com/github/senecajs/seneca-provider/maintainability)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

Shared utilities for Seneca provider plugins — the plugins that wrap
third-party APIs such as GitHub, Trello or Stripe.

This module does two things:

- **Holds provider keys** and serves them over `sys:provider`
  messages, so credentials live in one place instead of in every
  integration.
- **Builds provider plugins**, exposing remote API resources as Seneca
  entities under a `provider/<name>/<entity>` canon, with URL
  building, JSON handling, error wrapping, retry and token refresh
  provided for you.

Requires Node.js 24 or later.

## Install

```sh
$ npm install @seneca/provider
```

`seneca`, `seneca-entity` and `seneca-promisify` are peer
dependencies; `@seneca/env` is optional and enables environment
variable references in key values.

```sh
$ npm install seneca seneca-entity seneca-promisify
```

## Quick Example

Register the plugin, declaring the keys your providers need:

```js
Seneca({ legacy: false })
  .use('promisify')
  .use('entity')
  .use('provider', {
    provider: {
      github: {
        keys: {
          main: { value: process.env.GITHUB_TOKEN },
        }
      }
    }
  })
```

Then build a provider plugin on top of it. This one exposes GitHub
repositories as the entity `provider/repohome/readme`:

```js
function RepohomeProvider() {
  const seneca = this
  const entityBuilder = seneca.export('provider/entityBuilder')

  const { makeUrl, getJSON } = seneca.export('provider/makeUtils')({
    name: 'repohome',
    url: 'https://api.github.com/repos/senecajs/',
  })

  entityBuilder(seneca, {
    provider: { name: 'repohome' },
    entity: {
      readme: {
        cmd: {
          load: {
            action: async function (entize, msg) {
              const res = await getJSON(makeUrl(msg.q.id))
              const load = entize(res)
              load.id = msg.q.id
              return load
            }
          }
        }
      }
    }
  })
}
```

Remote data is now reachable through the ordinary entity API:

```js
const repo = await seneca.entity('provider/repohome/readme')
  .load$('seneca-provider')

console.log(repo.full_name)   // senecajs/seneca-provider
```

## Documentation

- **[Tutorial](doc/tutorial.md)** — build a working provider plugin
  from scratch, step by step. Start here.
- **[Guide](doc/guide.md)** — recipes: managing keys, retries, token
  refresh, query parameters, writes, error handling, testing.
- **[API reference](doc/api.md)** — every export, message and helper
  function.
- **[Options reference](doc/options.md)** — every option, with
  defaults.
- **[Concepts](doc/concepts.md)** — the design and its trade-offs.
- **[Developing](doc/develop.md)** — building, testing and releasing
  this repository.

## More Examples

See [test/](test/) for more usage examples.

## Motivation

Every integration with a third-party API repeats the same work:
building URLs, attaching credentials, parsing JSON, deciding what
counts as an error, retrying flaky calls, refreshing expired tokens.
Written separately for each API, that code drifts, and each
integration ends up handling failure a little differently.

This plugin factors out the parts that do not vary, and models remote
resources as Seneca entities so that calling code does not need to
know whether data is local or remote.

See [Concepts](doc/concepts.md) for the reasoning in full.

## Support

If you're using this module and need help, you can:

- Post a [github issue](https://github.com/senecajs/seneca-provider/issues)
- Tweet to [@senecajs](http://twitter.com/senecajs)
- Ask on the [Gitter](https://gitter.im/senecajs/seneca)

## API

### Options

- `provider` — map of provider name to `{ keys: { <name>: { value } } }`.
  Default `{}`.
- `entity.pin` — extra pattern properties merged into every generated
  entity message. Default `{ sys: 'entity' }`.

Full details in the [options reference](doc/options.md).


<!--END:options-->

<!--START:action-list-->

### Action Patterns

* [get:key,sys:provider](#-getkeysysprovider-)
* [get:keymap,sys:provider](#-getkeymapsysprovider-)
* [list:provider,sys:provider](#-listprovidersysprovider-)


<!--END:action-list-->

<!--START:action-desc-->

### Action Descriptions

### &laquo; `get:key,sys:provider` &raquo;

No description provided.



----------
### &laquo; `get:keymap,sys:provider` &raquo;

No description provided.



----------
### &laquo; `list:provider,sys:provider` &raquo;

No description provided.



----------


<!--END:action-desc-->

Message parameters and responses are documented in the
[API reference](doc/api.md#messages).

### Provider Plugins

* [@seneca/apimatic-provider](https://github.com/senecajs/seneca-apimatic-provider) - Apimatic API.
* [@seneca/branchio-provider](https://github.com/senecajs/seneca-branchio-provider) - Branchio API.
* [@seneca/checklyhq-provider](https://github.com/senecajs/seneca-checklyhq-provider) - Checkly API.
* [@seneca/customerio-provider](https://github.com/senecajs/seneca-customerio-provider) - Customerio API.
* [@seneca/eventbrite-provider](https://github.com/senecajs/seneca-eventbrite-provider) - Eventbrite API.
* [@seneca/evervault-provider](https://github.com/senecajs/seneca-evervault-provider) - Evervault API.
* [@seneca/gcal-provider](https://github.com/senecajs/seneca-gcal-provider) - Google Calendar API.
* [@seneca/github-provider](https://github.com/senecajs/seneca-github-provider) - GitHub API.
* [@seneca/gitlab-provider](https://github.com/senecajs/seneca-gitlab-provider) - GitLab API.
* [@seneca/hubspot-provider](https://github.com/senecajs/seneca-hubspot-provider) - HubSpot API.
* [@seneca/meetup-provider](https://github.com/senecajs/seneca-meetup-provider) - Meetup API.
* [@seneca/mixpanel-provider](https://github.com/senecajs/seneca-mixpanel-provider) - Mixpanel API.
* [@seneca/nordigen-provider](https://github.com/senecajs/seneca-nordigen-provider) - Nordigen API.
* [@seneca/notion-provider](https://github.com/senecajs/seneca-notion-provider) - Notion.so API.
* [@seneca/orbit-provider](https://github.com/senecajs/seneca-orbit-provider) - Orbit API.
* [@seneca/salesforce-provider](https://github.com/senecajs/seneca-salesforce-provider) - SalesForce API.
* [@seneca/stytch-provider](https://github.com/senecajs/seneca-stytch-provider) - Stytch API.
* [@seneca/tangocard-provider](https://github.com/senecajs/seneca-tangocard-provider) - Tangocard API.
* [@seneca/trello-provider](https://github.com/senecajs/seneca-trello-provider) - Trello API.
* [@seneca/typeform-provider](https://github.com/senecajs/seneca-typeform-provider) - Typeform API.
* [@seneca/vercel-provider](https://github.com/senecajs/seneca-vercel-provider) - Vercel API.
* [@seneca/webflow-provider](https://github.com/senecajs/seneca-webflow-provider) - Webflow API.
* [@seneca/zoom-provider](https://github.com/senecajs/seneca-zoom-provider) - Zoom API.

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

The [SenecaJS org](http://senecajs.org/) encourages participation. If you feel you can help in any way, be
it with bug reporting, documentation, examples, extra testing, or new features, feel free
to [create an issue](https://github.com/senecajs/seneca-maintain/issues/new), or better yet - [submit a Pull Request](https://github.com/senecajs/seneca-maintain/pulls). For more
information on contribution, please see our [Contributing Guide](http://senecajs.org/contribute).

To work on this repository — layout, build, test and release — see
[doc/develop.md](doc/develop.md).

## Background

Check out the SenecaJS roadmap [here](https://senecajs.org/roadmap/)!
