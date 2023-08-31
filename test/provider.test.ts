
import Provider from '../src/provider'
import ProviderDoc from '../src/provider-doc'

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')
const ProviderMessages = require('./provider.messages').default



describe('provider', () => {

  test('happy', async () => {
    expect(Provider).toBeDefined()
    expect(ProviderDoc).toBeDefined()

    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Provider)
    await seneca.ready()
  })


  test('env-vars', async () => {
    process.env.FOO = process.env.FOO || 'foo'
    const seneca = Seneca({ legacy: false })
      .test()
      .use('promisify')
      .use('env', {
        // debug: true,
        file: __dirname + '/env.json',
        var: {
          FOO: String,
          BAR: String,
        }
      })
      .use(Provider, {
        provider: {
          zed: {
            keys: {
              foo: { value: '$FOO' },
              bar: { value: '$BAR' },
            }
          }
        }
      })
    await seneca.ready()


    expect(seneca.find_plugin('provider').options).toEqual({
      entity: {
        pin: {
          sys: 'entity',
        },
      },
      provider: {
        zed: {
          keys: {
            bar: {
              value: 'bar',
            },
            foo: {
              value: 'foo',
            },
          },
          name: 'zed'
        }
      }
    })
  })


  test('messages', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Provider, {
      provider: {
        foo: {
          keys: {
            red: {
              value: 'foo-red'
            },
            green: {
              value: 'foo-green'
            },
          }
        },
        bar: {
          keys: {
            red: {
              value: 'bar-red'
            },
            blue: {
              value: 'bar-blue'
            },
          }
        },
      }
    })
    await (SenecaMsgTest(seneca, ProviderMessages)())
  })


  test('child-provider', async () => {
    const s0 = Seneca({ legacy: false })
      .test()
      .quiet()
      .use('promisify')
      .use('entity')
      .use(Provider, {})
      .use(function RepohomeProvider() {
        const seneca = this
        const entityBuilder = seneca.export('provider/entityBuilder')
        const { makeUrl, getJSON } =
          seneca.export('provider/makeUtils')({
            name: 'repohome',
            url: 'https://api.github.com/repos/senecajs/'
          })

        entityBuilder(seneca, {
          provider: {
            name: 'repohome'
          },
          entity: {
            readme: {
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

    let rm0 = await s0.entity('provider/repohome/readme').load$('seneca-provider')
    expect(rm0.id).toEqual('seneca-provider')
    expect(rm0.full_name).toEqual('senecajs/seneca-provider')

    try {
      await s0.entity('provider/repohome/readme').load$('not-a-seneca-plugin')
      fail()
    }
    catch (e) {
      expect(e.message).toContain('Provider repohome')
    }
  })



  test('entityBuilder', async () => {
    const seneca = Seneca({ legacy: false }).test()
      .use('promisify')
      .use('entity')
      .use(Provider)
    await seneca.ready()

    const entityBuilder = seneca.export('provider/entityBuilder')

    entityBuilder(seneca, {
      provider: {
        name: 'foo'
      },
      entity: {
        bar: {
          cmd: {
            list: {
              action: async function(this: any, entize: any, msg: any) {
                let res = [{ x: 1 }, { x: 2 }]
                let list = res.map((data: any) => entize(data))
                return list
              }
            }
          }
        }
      }
    })

    expect(seneca.list('sys:entity')[0]).toEqual({
      base: 'foo',
      cmd: 'list',
      name: 'bar',
      sys: 'entity',
      zone: 'provider',
    })

    expect(await seneca.entity('provider/foo/bar').list$()).toMatchObject([
      {
        "entity$": "provider/foo/bar",
        "x": 1,
      },
      {
        "entity$": "provider/foo/bar",
        "x": 2,
      },
    ])
  })


  test('intern.applyModifySpec', async () => {
    const applyModifySpec = Provider.intern.applyModifySpec
    expect(applyModifySpec({ x: 1 }, { field: { y: { src: 'x' } } }))
      .toEqual({ x: 1, y: 1 })
  })


  test('intern.makeEntize', async () => {
    const seneca = Seneca({ legacy: false }).test()
      .use('promisify')
      .use('entity')
      .use(Provider)
    await seneca.ready()


    const makeEntize = Provider.intern.makeEntize
    const entize = makeEntize(seneca, 'foo')

    let foo0 = entize({ x: 1 }, { field: { y: { src: 'x' } } })
    expect(foo0.data$()).toEqual({
      entity$: {
        base: undefined,
        name: 'foo',
        zone: undefined,
      }, x: 1, y: 1
    })

    let foo1 = entize(seneca.entity('foo').make$({ x: 1 }),
      { field: { y: { src: 'x' } } })
    expect(foo1).toEqual({ x: 1, y: 1 })
  })

})

