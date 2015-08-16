var test = require('tape');
var levelup = require('levelup');
var memdown = require('memdown');
var prefix = require('../');
var testCommon = require('abstract-leveldown/testCommon');
var testBuffer = require('memdown/testdata_b64');

var db = levelup('db', { db: memdown });
var prefixdown = prefix(db);

test('batch prefix', function(t){
  t.plan(3);
  var db = levelup({db:memdown}); //root levelup instance
  var prefixdown = prefix(db); //prefixdown factory

  //prefix as location
  var dbA = levelup('!a!', {db: prefixdown });
  var dbB = levelup('!b!', {db: prefixdown });
  var dbC = levelup('!c!', {db: prefixdown });

  dbA.batch([
    {
      type: 'put',
      key: 'foo',
      value: 'b',
      prefix: dbB
    },
    {
      type: 'put',
      key: 'foo',
      value: 'c',
      prefix: '!c!'
    },
    {
      type: 'put',
      key: 'foo',
      value: 'a'
    }
  ], function(){
    dbA.get('foo', function(err, val){
      t.equal(val, 'a', 'default prefix');
    });
    dbB.get('foo', function(err, val){
      t.equal(val, 'b', 'levelup prefixdown prefix');
    });
    dbC.get('foo', function(err, val){
      t.equal(val, 'c', 'string prefix');
    });
  });

});

// return;
//compatibility with basic LevelDOWN API

require('abstract-leveldown/abstract/leveldown-test').args(prefixdown, test, testCommon);
require('abstract-leveldown/abstract/open-test').args(prefixdown, test, testCommon);
require('abstract-leveldown/abstract/open-test').open(prefixdown, test, testCommon);
require('abstract-leveldown/abstract/del-test').all(prefixdown, test, testCommon);
require('abstract-leveldown/abstract/get-test').all(prefixdown, test, testCommon);
require('abstract-leveldown/abstract/put-test').all(prefixdown, test, testCommon);
require('abstract-leveldown/abstract/put-get-del-test').all(prefixdown, test, testCommon, testBuffer);
require('abstract-leveldown/abstract/batch-test').all(prefixdown, test, testCommon);
require('abstract-leveldown/abstract/chained-batch-test').all(prefixdown, test, testCommon);
require('abstract-leveldown/abstract/close-test').close(prefixdown, test, testCommon);
require('abstract-leveldown/abstract/iterator-test').all(prefixdown, test, testCommon);
require('abstract-leveldown/abstract/ranges-test').all(prefixdown, test, testCommon);
