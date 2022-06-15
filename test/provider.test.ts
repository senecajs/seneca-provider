
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

    expect(seneca.list('role:entity')[0]).toEqual({
      base: 'foo',
      cmd: 'list',
      name: 'bar',
      role: 'entity',
      zone: 'provider',
    })

    expect(await seneca.entity('provider/foo/bar').list$()).toEqual([
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

})

