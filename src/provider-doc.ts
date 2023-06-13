/* Copyright © 2021 Richard Rodger, MIT License. */



const messages = {
  get_key: {
    desc: 'Get the value for a specific provider and key name.',
  },

  list_provider: {
    desc: 'List all the providers and their key names.',
  }
}

const sections = {}

export default { messages, sections }

if ('undefined' !== typeof (module)) {
  module.exports = { messages, sections }
}
