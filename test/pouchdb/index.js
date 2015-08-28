var levelup = require('levelup')
var leveldown = require('leveldown')

require('rimraf').sync('test/db')

module.exports = require('../../')(
  levelup('test/db', { db: leveldown })
)
