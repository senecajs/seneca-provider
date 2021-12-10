



export default {
  print: false,
  pattern: 'sys:provider',
  allow: { missing: true },

  calls: [
    {
      pattern: 'get:key',
      params: { provider: 'foo', key: 'red' },
      out: { ok: true, value: 'foo-red' }
    },
    {
      pattern: 'get:key',
      params: { provider: 'foo', key: 'green' },
      out: { ok: true, value: 'foo-green' }
    },
    {
      pattern: 'get:key',
      params: { provider: 'bar', key: 'red' },
      out: { ok: true, value: 'bar-red' }
    },
    {
      pattern: 'get:key',
      params: { provider: 'bar', key: 'blue' },
      out: { ok: true, value: 'bar-blue' }
    },
    {
      pattern: 'get:key',
      params: { provider: 'not-a-provider', key: 'red' },
      out: { ok: false, why: 'unknown-provider' }
    },
    {
      pattern: 'get:key',
      params: { provider: 'foo', key: 'not-a-key' },
      out: { ok: false, why: 'unknown-key' }
    },
    {
      pattern: 'list:provider',
      params: {},
      out: {
        ok: true, list: [
          { name: 'foo', keys: ['red', 'green'] },
          { name: 'bar', keys: ['red', 'blue'] },
        ]
      }
    },
  ]
}
