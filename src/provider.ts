/* Copyright © 2022-2023 Richard Rodger, MIT License. */


// TODO: field manip utils:
// pick subsets, renames, ignore undefs, etc - see trello-provider for use case

import { AsyncLocalStorage } from 'node:async_hooks'

import FetchRetry from 'fetch-retry'


type Provider = {
  name: string
  keys: Record<string, KeyDesc>
}

type KeyDesc = {
  value: string
}

type ModifySpec = {
  field?: Record<string, {
    src: string
  }>
}

type ProviderOptions = {
  provider: Record<string, Provider>
  entity: {
    pin: Record<string, string | number | boolean | null>
  }
}

type ProviderUtilityOptions = {
  name: string
  url: string
  fetch?: any
  debug: boolean
  retry: boolean | {
    config: any
  },
  config?: Record<string, any>
}


function provider(this: any, options: ProviderOptions) {
  const seneca = this
  const { deep } = seneca.util

  const injectVars = seneca.export('env/injectVars')

  const providerMap: Record<string, Provider> = {}
  Object.entries(options.provider).forEach(([name, p]: [string, Provider]) => {
    p.name = name

    // Inject environment variables if defined by @seneca/env
    if (injectVars) {
      p = injectVars(p)
    }

    providerMap[name] = p
  })

  seneca
    .fix('sys:provider')
    .message('get:key', get_key)
    .message('get:keymap', get_keymap)
    .message('list:provider', list_provider)


  async function get_key(msg: any) {
    let p = providerMap[msg.provider]
    if (null == p) {
      return { ok: false, why: 'unknown-provider' }
    }

    let kd = p.keys[msg.key]
    if (null == kd) {
      return { ok: false, why: 'unknown-key' }
    }

    return { ok: true, value: kd.value }
  }


  async function get_keymap(msg: any) {
    let p = providerMap[msg.provider]
    if (null == p) {
      return { ok: false, why: 'unknown-provider' }
    }

    const keymap = seneca.util.deep(p.keys)

    return { ok: true, keymap: keymap }
  }


  async function list_provider(_msg: any) {
    return {
      ok: true, list: Object.values(providerMap).map((p: Provider) => ({
        name: p.name,
        keys: Object.keys(p.keys)
      }))
    }
  }


  const cmdBuilder: any = {
    list: (seneca: any, cmdspec: any, entspec: any, spec: any, options: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec, options),
        makeAction(cmdspec, entspec, spec))
    },

    load: (seneca: any, cmdspec: any, entspec: any, spec: any, options: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec, options),
        makeAction(cmdspec, entspec, spec))
    },

    save: (seneca: any, cmdspec: any, entspec: any, spec: any, options: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec, options),
        makeAction(cmdspec, entspec, spec))
    },

    remove: (seneca: any, cmdspec: any, entspec: any, spec: any, options: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec, options),
        makeAction(cmdspec, entspec, spec))
    },
  }


  const { Child } = seneca.valid

  const validateSpec = seneca.valid({
    provider: {
      name: String
    },

    entity: Child({
      cmd: Child({
        action: Function
      }, {})
    }, {})
  })

  function entityBuilder(seneca: any, spec: any) {
    spec = validateSpec(spec)

    for (let entname in spec.entity) {
      let entspec = spec.entity[entname]
      entspec.name = entname
      for (let cmdname in entspec.cmd) {
        let cmdspec = entspec.cmd[cmdname]
        cmdspec.name = cmdname
        cmdBuilder[cmdname](seneca, cmdspec, entspec, spec, options)
      }
    }
  }



  function makeUtils(utilopts: ProviderUtilityOptions) {
    // TODO: provider name for better errors

    utilopts.name = utilopts.name || ''

    const sharedConfig = utilopts.config || {}

    const asyncLocalStorage = new AsyncLocalStorage()

    let origFetcher: any =
      ('undefined' === typeof globalThis.fetch) ?
        (utilopts.fetch || require('node-fetch')) :
        globalThis.fetch
    let fetcher = origFetcher

    let retry = utilopts.retry
    if (true === retry) {
      fetcher = FetchRetry(fetcher)
    }
    else if (null != retry && 'object' === typeof retry) {
      fetcher = FetchRetry(fetcher, retry.config || {})
    }

    function makeUrl(suffix: string, q: any) {
      let url = utilopts.url + suffix
      if (q) {
        if ("string" === typeof q) {
          url += "/" + encodeURIComponent(q)
        } else if ("object" === typeof q && 0 < Object.keys(q).length) {
          url +=
            "?" +
            Object.entries(q)
              .reduce((u: any, kv: any) => (u.append(kv[0], kv[1]), u), new URLSearchParams())
              .toString()
        }
      }

      return url
    }


    async function get(url: string, config?: any) {
      const getConfig = deep(sharedConfig, config)
      const store = { config: getConfig }

      return asyncLocalStorage.run(store, async () => {
        const res = await fetcher(url, getConfig)

        // console.log('getJSON res', res.status)

        if (200 == res.status) {
          const json: any = await res.json()
          return json
        } else {
          const err: any = new Error('Provider ' + utilopts.name + ' ' + res.status)
          err.provider = {
            response: res,
            options,
            config,
          }
          throw err
        }
      })
    }


    // NOTE: can also be used for PUT, set method:'PUT'
    async function post(url: string, config?: any) {
      const postConfig = deep(
        {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          }
        },
        config || {},
        sharedConfig
      )

      postConfig.body =
        'string' === typeof config.body ? config.body :
          JSON.stringify(config.body)

      const store = { config: postConfig }

      return asyncLocalStorage.run(store, async () => {
        const res = await fetcher(url, postConfig)

        if (200 <= res.status && res.status < 300) {
          const json: any = await res.json()
          return json
        }
        else {
          const err: any = new Error('Provider ' + utilopts.name + ' ' + res.status)
          err.provider = {
            response: res,
            options,
            config,
          }

          try {
            err.provider.body = await res.json()
          } catch (e: any) {
            err.provider.body = await res.text()
          }

          throw err
        }
      })
    }


    async function deleteImpl(url: string, config?: any) {
      const deleteConfig = deep(
        {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json',
          }
        },
        config,
        sharedConfig
      )

      const store = { config: deleteConfig }

      return asyncLocalStorage.run(store, async () => {
        const res = await fetcher(url, deleteConfig)

        if (200 <= res.status && res.status < 300) {
          const json: any = await res.json()
          return json
        } else {
          const err: any = new Error('Provider ' + utilopts.name + ' ' + res.status)
          err.provider = {
            response: res,
            options,
            config,
          }

          try {
            err.provider.body = await res.json()
          } catch (e: any) {
            err.provider.body = await res.text()
          }

          throw err
        }
      })
    }


    return {
      entityBuilder,
      makeUrl,
      fetcher,
      origFetcher,
      fetchRetry: FetchRetry,
      asyncLocalStorage,
      get,
      post,
      delete: deleteImpl,
      getJSON: get,
      postJSON: post,
      deleteJSON: deleteImpl,
    }
  }

  return {
    exports: {
      entityBuilder,
      makeUtils
    }
  }

}


// For external testing
provider.intern = {
  makePattern,
  makeAction,
  makeEntize,
  applyModifySpec,
}


function makePattern(cmdspec: any, entspec: any, spec: any, options: any) {
  let pat: any = {
    cmd: cmdspec.name,
    zone: 'provider',
    base: spec.provider.name,
    name: entspec.name,
    ...(options?.entity?.pin || {})
  }

  return pat
}



function makeAction(cmdspec: any, entspec: any, spec: any) {
  let canon = 'provider/' + spec.provider.name + '/' + entspec.name
  let action = async function(this: any, msg: any, meta: any) {
    // let entize = (data: any) => this.entity(canon).data$(data)
    let entize = makeEntize(this, canon)
    let out = await cmdspec.action.call(this, entize, msg, meta)
    return out
  }
  Object.defineProperty(action, 'name', { value: cmdspec.name + '_' + entspec.name })
  return action
}


function makeEntize(seneca: any, canon: any) {

  // data -> Entity
  // Entity -> data
  return function entize(data: any, spec?: ModifySpec) {
    let isEnt =
      data &&
      'string' === typeof data.entity$ &&
      'function' === typeof data.data$

    let out

    if (isEnt) {
      let raw = data.data$(false)
      out = applyModifySpec(raw, spec)

    }
    else {
      data = applyModifySpec(data, spec)
      out = seneca.entity(canon).data$(data)
    }

    return out
  }
}


function applyModifySpec(data: any, spec?: ModifySpec) {
  if (spec) {
    if (spec.field) {
      for (let field in spec.field) {
        let fieldSpec = spec.field[field]

        // TODO: add more operations
        // 'copy' is the default operation
        if (null != fieldSpec.src) {
          data[field] = data[fieldSpec.src]
        }
      }
    }
  }
  return data
}



// Default options.
const defaults: ProviderOptions = {
  provider: {},
  entity: {
    pin: { sys: 'entity' }
  }
}

Object.assign(provider, { defaults })


export default provider

if ('undefined' !== typeof (module)) {
  module.exports = provider
}
