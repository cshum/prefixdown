var test = require('tape')
var leveldown = require('leveldown')
var levelup = require('levelup')
var prefix = require('../')
var testCommon = require('abstract-leveldown/testCommon')
var testBuffer = require('memdown/testdata_b64')

var db = levelup('test/db', { db: leveldown })
var prefixdown = prefix(db)

test('batch prefix', function (t) {
  t.plan(8)
  // prefix as location
  var dbA = levelup('!a!', { db: prefixdown })
  var dbB = levelup('!b!', { db: prefixdown })
  var dbC = levelup('!c!', { db: prefixdown })

  dbA.batch([
    { type: 'put', key: 'foo', value: 'b', prefix: dbB },
    { type: 'put', key: 'foo', value: 'c', prefix: '!c!' },
    { type: 'put', key: 'foo', value: 'a' },
    { type: 'put', key: 'foo', value: 'root', prefix: db }
  ], function () {
    db.get('foo', function (err, val) {
      t.notOk(err)
      t.equal(val, 'root', 'root levelup prefix')
    })
    dbA.get('foo', function (err, val) {
      t.notOk(err)
      t.equal(val, 'a', 'default prefix')
    })
    dbB.get('foo', function (err, val) {
      t.notOk(err)
      t.equal(val, 'b', 'levelup prefixdown prefix')
    })
    dbC.get('foo', function (err, val) {
      t.notOk(err)
      t.equal(val, 'c', 'string prefix')
    })
  })

})

// compatibility with basic LevelDOWN API
require('abstract-leveldown/abstract/leveldown-test').args(prefixdown, test, testCommon)
require('abstract-leveldown/abstract/open-test').args(prefixdown, test, testCommon)
require('abstract-leveldown/abstract/open-test').open(prefixdown, test, testCommon)
require('abstract-leveldown/abstract/del-test').all(prefixdown, test, testCommon)
require('abstract-leveldown/abstract/get-test').all(prefixdown, test, testCommon)
require('abstract-leveldown/abstract/put-test').all(prefixdown, test, testCommon)
require('abstract-leveldown/abstract/put-get-del-test').all(prefixdown, test, testCommon, testBuffer)
require('abstract-leveldown/abstract/batch-test').all(prefixdown, test, testCommon)
require('abstract-leveldown/abstract/chained-batch-test').all(prefixdown, test, testCommon)
require('abstract-leveldown/abstract/close-test').close(prefixdown, test, testCommon)
require('abstract-leveldown/abstract/iterator-test').all(prefixdown, test, testCommon)
require('abstract-leveldown/abstract/ranges-test').all(prefixdown, test, testCommon)
