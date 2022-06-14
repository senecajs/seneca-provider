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
  .use('provider', {
    provider: {
      AnExternalService: {
        keys: {
          KeyNameZero: {
            value: '<SECRET>'
          },
          KeyNameOne: {
            value: '<SECRET>'
          },
        }
      }
    }
  })

// Later, get the key. Usually you would do this inside
// the Plugin preparation phase of a provider plugin:

function MyPlugin(options) {
  let externalServiceSDK = null
  
  this.prepare(async function() {
    let out = await this.post('sys:provider,get:key,provider:AnExternalService,key:KeyNameZero')
    if (!out.ok) {
      this.fail('api-key-missing')
    }

    let config = {
      auth: out.value
    }

    externalServiceSDK = new ExternalServiceSDK(config)
  })

} 


```

## Install

```sh
$ npm install @seneca/provider
```



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
* [list:provider,sys:provider](#-listprovidersysprovider-)


<!--END:action-list-->

<!--START:action-desc-->


## Action Descriptions

### &laquo; `get:key,sys:provider` &raquo;

Get the value for a specific provider and key name.



----------
### &laquo; `list:provider,sys:provider` &raquo;

List all the providers and their key names.



----------


<!--END:action-desc-->
