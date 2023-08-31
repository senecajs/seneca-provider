

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')
const ProviderMessages = require('./provider.messages').default

import Provider from '../src/provider'
import ProviderDoc from '../src/provider-doc'

import { makeApiServer } from './api-server'


describe('api', () => {

  beforeAll(async () => {
    makeApiServer()
  })

  test('zed', async () => {
    const s0 = Seneca({ legacy: false })
      .test()
      // .quiet()
      .use('promisify')
      .use('entity')
      .use(Provider, {})
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
    console.log(z0)
  })

})



