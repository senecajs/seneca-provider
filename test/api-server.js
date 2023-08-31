
const Express = require('express')


if( module === require.main ) {
  makeApiServer()
}

function makeApiServer() {

  // State is deterministic
  let state = {
    key: 'KEY',
    token: {
      refresh: 0,
      access: 0,
    },
    entity: {
      zed: 0
    }
  }

  let s0 = Express()
  s0
    .use(Express.json())
    .use((req,res)=>{
      console.log('REQ', req.path, state)
      req.next()
    })
  
    .get('/token/refresh', (req, res) => {
      console.log(req)
      let key = req.get('x-sp-key')
      if(key === state.key) {
        state.token.refresh++
        res.send({refresh:'R'+state.token.refresh})
      }
      else {
        res.status(401).end()
      }
    })
    .get('/token/access', (req, res) => {
      let refresh = req.get('x-sp-refresh')
      if(refresh === 'R'+state.token.refresh) {
        state.token.access++
        res.send({access:'A'+state.token.access})
      }
      else {
        console.log('INVALID REFRESH', refresh)
        res.status(401).end()
      }
    })
    .get('/entity/foo/:id', (req, res) => {
      let access = req.get('x-sp-access')
      if(access === 'A'+state.token.access) {
        res.send({id:req.params.id,kind:'foo'})
      }
      else {
        console.log('INVALID ACCESS', access)
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
        console.log('ZED 500')
        res.status(500).end()
      }
    })

  
    .listen(60101)


}

module.exports = {
  makeApiServer
}
