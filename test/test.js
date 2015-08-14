var test = require('tape');
var levelup = require('levelup');
var memdown = require('memdown');
var prefix = require('../');
var testCommon = require('abstract-leveldown/testCommon');
var testBuffer = require('memdown/testdata_b64');

var db = levelup('db', { db: memdown });
var prefixdown = prefix(db);

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
