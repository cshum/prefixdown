var test = require('tape')
var leveldown = require('leveldown')
var levelup = require('levelup')
var levelSublevel = require('level-sublevel')
var prefix = require('../')
var testCommon = require('abstract-leveldown/testCommon')
var testBuffer = require('memdown/testdata_b64')
var callback = require('callback-stream')

require('rimraf').sync('test/db')

var db = levelup('test/db', { db: leveldown })
var subdb = levelSublevel(db).sublevel('whatever')
var dbs = [db, subdb]

test('Errors', function (t) {
  t.throws(function () { prefix(leveldown) }, {
    name: 'Error', message: 'db must be a LevelUP instance.'
  }, 'invalid db throws')
  t.end()
})

dbs.forEach(function (db) {
  var prefixdown = prefix(db)
  test('PrefixDOWN specific', function (t) {
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
          t.equal(val, 'b', 'levelup prefixdown prefix')
        })
        dbC.get('foo', function (err, val) {
          t.notOk(err)
          t.equal(val, 'c', 'string prefix')
        })
        prefixdown.destroy('!a!', function (err) {
          t.notOk(err)
          prefixdown.destroy('!c!', function (err) {
            t.notOk(err)
            db.keyStream().pipe(callback.obj(function (err, list) {
              t.notOk(err)
              t.deepEqual(list, [
                '!b!foo',
                'foo'
              ], 'prefixdown.destroy()')
              t.end()
            }))
          })
        })
      }))
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
})
