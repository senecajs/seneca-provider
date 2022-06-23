/* Copyright © 2022 Richard Rodger, MIT License. */


// TODO: field manip utils:
// pick subsets, renames, ignore undefs, etc - see trello-provider for use case



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


  const cmdBuilder: any = {
    list: (seneca: any, cmdspec: any, entspec: any, spec: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec),
        makeAction(cmdspec, entspec, spec))
    },

    load: (seneca: any, cmdspec: any, entspec: any, spec: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec),
        makeAction(cmdspec, entspec, spec))
    },

    save: (seneca: any, cmdspec: any, entspec: any, spec: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec),
        makeAction(cmdspec, entspec, spec))
    },

    remove: (seneca: any, cmdspec: any, entspec: any, spec: any) => {
      seneca.message(makePattern(cmdspec, entspec, spec),
        makeAction(cmdspec, entspec, spec))
    },
  }


  function makePattern(cmdspec: any, entspec: any, spec: any) {
    return {
      role: 'entity',
      cmd: cmdspec.name,
      zone: 'provider',
      base: spec.provider.name,
      name: entspec.name
    }
  }


  function makeAction(cmdspec: any, entspec: any, spec: any) {
    let canon = 'provider/' + spec.provider.name + '/' + entspec.name
    let action = async function(this: any, msg: any, meta: any) {
      let entize = (data: any) => this.entity(canon).data$(data)
      return cmdspec.action.call(this, entize, msg, meta)
    }
    Object.defineProperty(action, 'name', { value: 'load_' + entspec.name })
    return action
  }



  const { Value } = seneca.valid

  const validateSpec = seneca.valid({
    provider: {
      name: String
    },

    entity: Value({
      cmd: Value({
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
        cmdBuilder[cmdname](seneca, cmdspec, entspec, spec)
      }
    }
  }


  return {
    exports: {
      entityBuilder
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
