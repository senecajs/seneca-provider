

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')
const ProviderMessages = require('./provider.messages').default

import Provider from '../src/provider'
import ProviderDoc from '../src/provider-doc'

import { makeApiServer } from './api-server'


let server = null


describe('api', () => {


  beforeAll(async () => {
    server = makeApiServer()
  })

  afterAll(async () => {
    server.close()
  })


  test('retry-zed', async () => {
    const s0 = makeSeneca()
      .use(function ApiProvider() {
        const seneca = this
        const entityBuilder = seneca.export('provider/entityBuilder')
        const { makeUrl, getJSON } =
          seneca.export('provider/makeUtils')({
            name: 'api',
            url: 'http://127.0.0.1:60101/entity/zed/',
            retry: {
              config: {
                retryDelay: 100,
                retryOn: [500]
              }
            }
          })

        entityBuilder(seneca, {
          provider: {
            name: 'api'
          },
          entity: {
            zed: {
              cmd: {
                load: {
                  action: async function(this: any, entize: any, msg: any) {
                    const res: any =
                      await getJSON(makeUrl(msg.q.id))

                    let load = res ? entize(res) : null

                    load.id = msg.q.id

                    return load
                  }
                }
              }
            }
          }
        })
      })

    let z0 = await s0.entity('provider/api/zed').load$('0')
    expect(z0).toMatchObject({ id: '0', kind: 'bar' })
  })


  test('refresh-foo', async () => {
    const config = {
      headers: {
      }
    }

    const s0 = makeSeneca({
      provider: {
        api: {
          keys: {
            main: { value: 'KEY' },
          }
        }
      }
    })
      .use(function ApiProvider() {
        const seneca = this
        const entityBuilder = seneca.export('provider/entityBuilder')
        const prefix = 'http://127.0.0.1:60101/'
        let refreshToken = null

        const reqSeneca = seneca.root.delegate()

        const { makeUrl, getJSON, origFetcher, asyncLocalStorage } =
          seneca.export('provider/makeUtils')({
            name: 'api',
            url: prefix + 'entity/foo/',
            config,
            retry: {
              config: {
                retryDelay: 100,
                retryOn: async function(attempt: number, _error: any, response: any) {
                  if (4 <= attempt) {
                    return false
                  }

                  if (500 <= response.status && attempt <= 3) {
                    return true
                  }

                  if (401 === response.status) {
                    try {
                      if (null == refreshToken) {
                        // console.log('GET REFRESH', config.headers)

                        let keyspec =
                          await reqSeneca.post(
                            'sys:provider,get:key,provider:api,key:main')
                        let keyval = keyspec.value

                        let refreshResult =
                          await origFetcher(prefix + 'token/refresh', {
                            headers: {
                              // 'x-sp-key': 'KEY'
                              'x-sp-key': keyval
                            }
                          })
                        let refreshJSON = await refreshResult.json()
                        // console.log('refresh json', refreshJSON)

                        // TODO: don't store here
                        refreshToken = refreshJSON.refresh

                        return true
                      }
                      else {
                        // console.log('GET ACCESS', config.headers)

                        let accessResult = await origFetcher(prefix + 'token/access', {
                          headers: {
                            // TODO: get from provider
                            'x-sp-refresh': refreshToken
                          }
                        })

                        // HOW IS referesh token expiry indicated?

                        // console.log('access res', accessResult.status)
                        if (401 === accessResult.status) {
                          refreshToken = null
                          return true
                        }

                        let accessJSON = await accessResult.json()
                        // console.log('access json', accessJSON)

                        let store = asyncLocalStorage.getStore()
                        // console.log('store', store)
                        let currentConfig = store.config
                        currentConfig.headers['x-sp-access'] = accessJSON.access
                        config.headers['x-sp-access'] = accessJSON.access

                        // console.log('store end', store)

                        return true
                      }
                    }
                    catch (e) {
                      console.log('E401', e)
                      throw e
                    }
                  }
                }
              }
            }
          })

        entityBuilder(seneca, {
          provider: {
            name: 'api'
          },
          entity: {
            foo: {
              cmd: {
                load: {
                  action: async function(this: any, entize: any, msg: any) {
                    // console.log('LOAD foo', config)
                    const res: any =
                      await getJSON(makeUrl(msg.q.id), config)
                    // console.log('LOAD res', res)

                    let load = res ? entize(res) : null
                    load.id = msg.q.id

                    load.a = config.headers['x-sp-access']
                    load.r = refreshToken

                    return load
                  }
                }
              }
            }
          }
        })
      })

    let f0 = await s0.entity('provider/api/foo').load$('0')
    expect(f0).toMatchObject({ id: '0', kind: 'foo', a: 'A1', r: 'R1' })

    let f1 = await s0.entity('provider/api/foo').load$('1')
    expect(f1).toMatchObject({ id: '1', kind: 'foo', a: 'A1', r: 'R1' })

    let f2 = await s0.entity('provider/api/foo').load$('2')
    expect(f2).toMatchObject({ id: '2', kind: 'foo', a: 'A1', r: 'R1' })

    let f3 = await s0.entity('provider/api/foo').load$('3')
    expect(f3).toMatchObject({ id: '3', kind: 'foo', a: 'A2', r: 'R1' })

    let f4 = await s0.entity('provider/api/foo').load$('4')
    expect(f4).toMatchObject({ id: '4', kind: 'foo', a: 'A2', r: 'R1' })

    let f5 = await s0.entity('provider/api/foo').load$('5')
    expect(f5).toMatchObject({ id: '5', kind: 'foo', a: 'A10', r: 'R2' })

    let f6 = await s0.entity('provider/api/foo').load$('6')
    expect(f6).toMatchObject({ id: '6', kind: 'foo', a: 'A11', r: 'R2' })

    let f7 = await s0.entity('provider/api/foo').load$('7')
    expect(f7).toMatchObject({ id: '7', kind: 'foo', a: 'A11', r: 'R2' })

  })

})


function makeSeneca(providerOptions?: any) {
  const s0 = Seneca({ legacy: false })
    .test()
    // .quiet()
    .use('promisify')
    .use('entity')
    .use(Provider, providerOptions || {})
  return s0
}

