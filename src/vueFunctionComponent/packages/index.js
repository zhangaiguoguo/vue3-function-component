'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/vueFunctionComponent.cjs.js')
} else {
  module.exports = require('./dist/vueFunctionComponent.esm.js')
}