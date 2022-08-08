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

* [@seneca/hubspot-provider](github.com/senecajs/seneca-hubspot-provider) - Seneca plugin that provides access to the HubSpot API.
* [@seneca/eventbrite-provider](github.com/senecajs/seneca-eventbrite-provider) - Seneca provider for the eventbrite.com API.
* [@seneca/gcal-provider](github.com/senecajs/seneca-gcal-provider) - Seneca plugin that provides access to the Google Calendar API.
* [@seneca/github-provider](github.com/senecajs/seneca-github-provider) - Seneca plugin that provides access to the GitHub API.
* [@seneca/gitlab-provider](github.com/senecajs/seneca-gitlab-provider) - Seneca plugin that provides access to the GitLab API.
* [@seneca/nordigen-provider](github.com/senecajs/seneca-nordigen-provider) - Seneca provider for the nordigen API
* [@seneca/notion-provider](github.com/senecajs/seneca-notion-provider) - Seneca plugin that provides access to the Notion.so API.
* [@seneca/salesforce-provider](github.com/senecajs/seneca-salesforce-provider) - Seneca plugin that provides access to the SalesForce API.
* [@seneca/stytch-provider](github.com/senecajs/seneca-stytch-provider) - Seneca plugin that provides access to the Stytch API.
* [@seneca/trello-provider](github.com/senecajs/seneca-trello-provider template) - Seneca plugin that provides access to the Trello API.


# Write Your Own Provider


* [seneca-example-provider](github.com/senecajs/seneca-eventbrite-provider) - Example Provider Plugin starting point


<!--START:options-->


## Options

* `provider` : object <i><small>[object Object]</small></i>


Set plugin options when loading with:
```js


seneca.use('provider', { name: value, ... })


```


<small>Note: <code>foo.bar</code> in the list above means 
<code>{ foo: { bar: ... } }</code></small> 



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

Get the value for a specific provider and key name.



----------
### &laquo; `get:keymap,sys:provider` &raquo;

No description provided.



----------
### &laquo; `list:provider,sys:provider` &raquo;

List all the providers and their key names.



----------


<!--END:action-desc-->
