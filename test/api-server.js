
const Express = require('express')


if( module === require.main ) {
  makeApiServer()
}


function makeApiServer() {

  // State is deterministic
  let state = {
    key: 'KEY',
    token: {
      refresh: 1,
      access: 0,
    },
    entity: {
      zed: 0,
      foo: 0,
    }
  }

  let s0 = Express()
  s0
    .use(Express.json())
    .use((req,res)=>{
      // console.log('REQ', req.path, state)
      req.next()
    })
  
    .get('/token/refresh', (req, res) => {
      let key = req.get('x-sp-key')
      // console.log('GET /token/refresh', key)

      if(key === state.key) {
        state.token.access = 0+(Math.pow(10,state.token.refresh-1))
        res.send({refresh:'R'+state.token.refresh})
      }
      else {
        res.status(401).end()
      }
    })
    .get('/token/access', (req, res) => {
      let refresh = req.get('x-sp-refresh')
      // console.log('GET /token/access', refresh)
      
      
      if(refresh === 'R'+state.token.refresh) {
        res.send({access:'A'+state.token.access})
      }
      else {
        // console.log('INVALID REFRESH', refresh)
        res.status(401).end()
      }
    })
    .get('/entity/foo/:id', (req, res) => {
      let access = req.get('x-sp-access')
      // console.log('GET /entity/foo', access)
      

      if(access === 'A'+state.token.access) {
        state.entity.foo++

        if(0 === (state.entity.foo % 3)) {
          state.token.access++
        }

        if(0 === (state.entity.foo % 5)) {
          state.token.access = 0
          state.token.refresh++
        }

        res.send({id:req.params.id,kind:'foo'})
      }
      else {
        // console.log('INVALID ACCESS', access)
        res.status(401).end()
      }
    })
    .get('/entity/bar/:id', (req, res) => {
      res.send({id:req.params.id,kind:'bar'})
    })
    .get('/entity/zed/:id', (req, res) => {
      state.entity.zed++
      if(3 <= state.entity.zed) {
        res.send({id:req.params.id,kind:'bar'})
      }
      else {
        // console.log('ZED 500')
        res.status(500).end()
      }
    })


  let server = s0.listen(60101)
  
  return server
}

module.exports = {
  makeApiServer
}
