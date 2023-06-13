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

* [@seneca/hubspot-provider](https://github.com/senecajs/seneca-hubspot-provider) - Seneca plugin that provides access to the HubSpot API.
* [@seneca/eventbrite-provider](https://github.com/senecajs/seneca-eventbrite-provider) - Seneca provider for the eventbrite.com API.
* [@seneca/gcal-provider](https://github.com/senecajs/seneca-gcal-provider) - Seneca plugin that provides access to the Google Calendar API.
* [@seneca/github-provider](https://github.com/senecajs/seneca-github-provider) - Seneca plugin that provides access to the GitHub API.
* [@seneca/gitlab-provider](https://github.com/senecajs/seneca-gitlab-provider) - Seneca plugin that provides access to the GitLab API.
* [@seneca/nordigen-provider](https://github.com/senecajs/seneca-nordigen-provider) - Seneca provider for the nordigen API
* [@seneca/notion-provider](https://github.com/senecajs/seneca-notion-provider) - Seneca plugin that provides access to the Notion.so API.
* [@seneca/salesforce-provider](https://github.com/senecajs/seneca-salesforce-provider) - Seneca plugin that provides access to the SalesForce API.
* [@seneca/stytch-provider](https://github.com/senecajs/seneca-stytch-provider) - Seneca plugin that provides access to the Stytch API.
* [@seneca/trello-provider](https://github.com/senecajs/seneca-trello-provider) - Seneca plugin that provides access to the Trello API.
* [@seneca/typeform-provider](https://github.com/senecajs/seneca-typeform-provider) - Seneca plugin that provides access to the Typeform API.
* [@seneca/webflow-provider](https://github.com/senecajs/seneca-webflow-provider) - Seneca plugin that provides access to the Webflow API.
* [@seneca/checklyhq-provider](https://github.com/senecajs/seneca-checklyhq-provider) - Seneca plugin that provides access to the Checkly API.
* [@seneca/evervault-provider](https://github.com/senecajs/seneca-evervault-provider) - Seneca plugin that provides access to the Evervault API.


# Write Your Own Provider


* [seneca-example-provider](https://github.com/senecajs/seneca-example-provider) - Example Provider Plugin starting point


<!--START:options-->


## Options

*None.*


<!--END:options-->

<!--START:action-list-->


## Action Patterns

* ["sys":"provider","get":"key"](#-sysprovidergetkey-)
* ["sys":"provider","get":"keymap"](#-sysprovidergetkeymap-)
* ["sys":"provider","list":"provider"](#-sysproviderlistprovider-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `"sys":"provider","get":"key"` &raquo;

Get the value for a specific provider and key name.



----------
### &laquo; `"sys":"provider","get":"keymap"` &raquo;

No description provided.



----------
### &laquo; `"sys":"provider","list":"provider"` &raquo;

List all the providers and their key names.



----------


<!--END:action-desc-->
