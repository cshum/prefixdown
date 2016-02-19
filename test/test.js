var test = require('tape')
var leveldown = require('leveldown')
var levelup = require('levelup')
var levelSublevel = require('level-sublevel')
var prefixdown = require('../')
var testCommon = require('abstract-leveldown/testCommon')
var testBuffer = require('./testdata_b64')
var callback = require('callback-stream')

require('rimraf').sync('test/db')

var db = levelup('test/db', { db: leveldown })
var dbs = [
  db,
  levelSublevel(db).sublevel('level-sublevel')
]

dbs.forEach(function (db) {
  test('PrefixDOWN specific', function (t) {
    // prefix as location
    var options = { db: prefixdown, levelup: db }
    var dbA = levelup('!a!', options)
    var dbB = levelup('!b!', options)
    var dbC = levelup('!c!', options)

    dbA.batch([
      { type: 'put', key: 'foo', value: 'b', prefix: dbB },
      { type: 'put', key: 'foo', value: 'c', prefix: '!c!' },
      { type: 'put', key: 'foo', value: 'a' },
      { type: 'put', key: 'foo', value: 'root', prefix: db }
    ], function () {
      db.keyStream().pipe(callback.obj(function (err, list) {
        t.notOk(err)
        t.deepEqual(list, [
          '!a!foo',
          '!b!foo',
          '!c!foo',
          'foo'
        ])

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
          t.equal(val, 'b', 'levelup prefix prefix')
        })
        dbC.get('foo', function (err, val) {
          t.notOk(err)
          t.equal(val, 'c', 'string prefix')
        })
        prefixdown.destroy(db, '!a!', function (err) {
          t.notOk(err)
          prefixdown.destroy(db, '!c!', function (err) {
            t.notOk(err)
            db.keyStream().pipe(callback.obj(function (err, list) {
              t.notOk(err)
              t.deepEqual(list, [
                '!b!foo',
                'foo'
              ], 'prefix.destroy()')
              prefixdown.destroy(db, '!b!', t.end)
            }))
          })
        })
      }))
    })
  })

  // compatibility with basic LevelDOWN API
  var prefix = prefixdown(db)
  require('abstract-leveldown/abstract/leveldown-test').args(prefix, test, testCommon)
  require('abstract-leveldown/abstract/open-test').args(prefix, test, testCommon)
  require('abstract-leveldown/abstract/del-test').all(prefix, test, testCommon)
  require('abstract-leveldown/abstract/get-test').all(prefix, test, testCommon)
  require('abstract-leveldown/abstract/put-test').all(prefix, test, testCommon)
  require('abstract-leveldown/abstract/put-get-del-test').all(prefix, test, testCommon, testBuffer)
  require('abstract-leveldown/abstract/batch-test').all(prefix, test, testCommon)
  require('abstract-leveldown/abstract/chained-batch-test').all(prefix, test, testCommon)
  require('abstract-leveldown/abstract/close-test').close(prefix, test, testCommon)
  require('abstract-leveldown/abstract/iterator-test').all(prefix, test, testCommon)
  require('abstract-leveldown/abstract/ranges-test').all(prefix, test, testCommon)
})
