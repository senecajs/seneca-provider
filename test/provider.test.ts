
import Provider from '../src/provider'

const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')
const ProviderMessages = require('./provider.messages').default



describe('provider', () => {

  test('happy', async () => {
    const seneca = Seneca({ legacy: false }).test().use('promisify').use(Provider)
    await seneca.ready()
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

})

