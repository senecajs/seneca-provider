/* Copyright © 2021-2026 Richard Rodger, MIT License. */
'use strict'

const { describe, test } = require('node:test')
const assert = require('node:assert')

const Provider = require('../dist/provider')
const ProviderDoc = require('../dist/provider-doc')

const { ProviderMessages } = require('../dist-test/provider.messages')

const Seneca = require('seneca')
const { Maintain } = require('@seneca/maintain')
const SenecaMsgTest = require('seneca-msg-test')



describe('provider', () => {

  test('happy', async () => {
    assert.ok(Provider)
    assert.ok(ProviderDoc)

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


    assert.deepEqual(seneca.find_plugin('provider').options, {
      init$: true,
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


  test('maintain', async () => {
    await Maintain()
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

        // This test hits the live GitHub API. Unauthenticated requests are
        // capped at 60/hour per IP, which CI runners share - authenticate
        // when a token is available to lift the cap to 5000/hour.
        const config = { headers: {} }
        if (process.env.GITHUB_TOKEN) {
          config.headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN
        }

        const { makeUrl, getJSON } =
          seneca.export('provider/makeUtils')({
            name: 'repohome',
            url: 'https://api.github.com/repos/senecajs/',
            config,
          })

        entityBuilder(seneca, {
          provider: {
            name: 'repohome'
          },
          entity: {
            readme: {
              cmd: {
                load: {
                  action: async function(entize, msg) {
                    const res = await getJSON(makeUrl(msg.q.id))

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
    assert.equal(rm0.id, 'seneca-provider')
    assert.equal(rm0.full_name, 'senecajs/seneca-provider')

    await assert.rejects(
      () => s0.entity('provider/repohome/readme').load$('not-a-seneca-plugin'),
      (e) => e.message.includes('Provider repohome')
    )
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
              action: async function(entize, msg) {
                let res = [{ x: 1 }, { x: 2 }]
                let list = res.map((data) => entize(data))
                return list
              }
            }
          }
        }
      }
    })

    assert.deepEqual(seneca.list('sys:entity')[0], {
      base: 'foo',
      cmd: 'list',
      name: 'bar',
      sys: 'entity',
      zone: 'provider',
    })

    assert.partialDeepStrictEqual(
      await seneca.entity('provider/foo/bar').list$(),
      [
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
    assert.deepEqual(
      applyModifySpec({ x: 1 }, { field: { y: { src: 'x' } } }),
      { x: 1, y: 1 })
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
    assert.deepEqual(foo0.data$(), {
      entity$: {
        base: undefined,
        name: 'foo',
        zone: undefined,
      }, x: 1, y: 1
    })

    let foo1 = entize(seneca.entity('foo').make$({ x: 1 }),
      { field: { y: { src: 'x' } } })
    assert.deepEqual(foo1, { x: 1, y: 1 })
  })

})
