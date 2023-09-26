![Seneca Provider](http://senecajs.org/files/assets/seneca-logo.png)

> _Seneca Provider_ is a plugin for [Seneca](http://senecajs.org)


A plugin to support access to third party APIs. This is the base
plugin used by service-specific provider plugins (such as
[@seneca/github-provider](https://github.com/senecajs/seneca-github-provider))
to handle key management and other shared tasks.


[![npm version](https://img.shields.io/npm/v/@seneca/provider.svg)](https://npmjs.com/package/@seneca/provider)
[![build](https://github.com/senecajs/seneca-provider/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-provider/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-provider/badge.svg?branch=main)](https://coveralls.io/github/senecajs/seneca-provider?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-provider/badge.svg)](https://snyk.io/test/github/senecajs/seneca-provider)
[![DeepScan grade](https://deepscan.io/api/teams/5016/projects/19459/branches/505694/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5016&pid=19459&bid=505694)
[![Maintainability](https://api.codeclimate.com/v1/badges/ee603417bbb953d35ebe/maintainability)](https://codeclimate.com/github/senecajs/seneca-provider/maintainability)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|


## Quick Example


```js

// Setup - get the key value (<SECRET>) separately from a vault or
// environment variable.
Seneca()
  .use('provider')


```

## Install

```sh
$ npm install @seneca/provider
```



## Provider Plugins

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


# Write Your Own Provider


* [seneca-example-provider](https://github.com/senecajs/seneca-example-provider) - Example Provider Plugin starting point


<!--START:options-->


## Options

*None.*


<!--END:options-->

<!--START:action-list-->


## Action Patterns

* [get:key,sys:provider](#-getkeysysprovider-)
* [get:keymap,sys:provider](#-getkeymapsysprovider-)
* [list:provider,sys:provider](#-listprovidersysprovider-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

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

## More Examples

## Motivation

## Support

Check out our sponsors and supporters, Voxgig, on their website [here](https://www.voxgig.com).

## API

## Contributing

The [SenecaJS org](http://senecajs.org/) encourages participation. If you feel you can help in any way, be
it with bug reporting, documentation, examples, extra testing, or new features, feel free
to [create an issue](https://github.com/senecajs/seneca-maintain/issues/new), or better yet - [submit a Pull Request](https://github.com/senecajs/seneca-maintain/pulls). For more
information on contribution, please see our [Contributing Guide](http://senecajs.org/contribute).

## Background

Check out the SenecaJS roadmap [here](https://senecajs.org/roadmap/)!
