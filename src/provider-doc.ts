/* Copyright © 2021 Richard Rodger, MIT License. */



const docs = {

  get_key: {
    desc: 'Get the value for a specific provider and key name.',
  },

  list_provider: {
    desc: 'List all the providers and their key names.',
  }
}

export default docs

if ('undefined' !== typeof (module)) {
  module.exports = docs
}
