/* Copyright © 2021 Richard Rodger, MIT License. */


type Provider = {
  name: string
  keys: Record<string, KeyDesc>
}

type KeyDesc = {
  value: string
}

type ProviderOptions = {
  provider: Record<string, Provider>
}


function provider(this: any, options: ProviderOptions) {
  const seneca = this

  const providerMap: Record<string, Provider> = {}
  Object.entries(options.provider).forEach(([name, p]: [string, Provider]) => {
    p.name = name
    providerMap[name] = p
  })


  seneca
    .fix('sys:provider')
    .message('get:key', get_key)
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


  async function list_provider(_msg: any) {
    return {
      ok: true, list: Object.values(providerMap).map((p: Provider) => ({
        name: p.name,
        keys: Object.keys(p.keys)
      }))
    }
  }
}


// Default options.
const defaults: ProviderOptions = {
  provider: {}
}

Object.assign(provider, { defaults })


export default provider

if ('undefined' !== typeof (module)) {
  module.exports = provider
}
