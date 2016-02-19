# PrefixDOWN

LevelDB sections using key prefix as a [LevelUP](https://github.com/Level/levelup) backend.

[![Build Status](https://travis-ci.org/cshum/prefixdown.svg?branch=master)](https://travis-ci.org/cshum/prefixdown)

```bash
npm install prefixdown
```

By exposing a [LevelDOWN](https://github.com/Level/abstract-leveldown) compatible module, PrefixDOWN does not modify, nor set a wrapper on top of current LevelUP instance. 
So that it can be used on any existing LevelUP based libraries.
Inspired from [Subleveldown](https://github.com/mafintosh/subleveldown). 

PrefixDOWN factory for the root LevelUP instance.
### levelup(prefix, { db: prefixdown, levelup: db })
### levelup(prefix, { db: prefixdown(db) })
PrefixDOWN on top of [LevelUP](https://github.com/Level/levelup#ctor), where `location` argument defines the `prefix`.

```js
var levelup = require('levelup')
var prefixdown = require('prefixdown')

var db = levelup('./db') //root levelup instance

//location as prefix
var dbA = levelup('!a!', { db: prefixdown, levelup: db })
var dbB = levelup('!b!', { db: prefixdown(db) })

dbA.put('foo', 'bar', function () {
  dbB.put('foo', 'foo', function () {
    db.createReadStream().on('data', function (data) {
      //Results from root db
      {key: '!a!foo', value: 'bar'}, 
      {key: '!b!foo', value: 'foo'}
    })
  })
})

```

### options.prefix
PrefixDOWN supports `options.prefix` property. A batch operation can be applied into multiple sections under the same database.

```js
var dbA = levelup('!a!', { db: prefixdown, levelup: db })
var dbB = levelup('!b!', { db: prefixdown, levelup: db })

dbA.batch([
  {key: 'key', value: 'a', type: 'put'}, //put under dbA
  {key: 'key', value: 'b', type: 'put', prefix: dbB} //put under dbB
], ...)
```

## License

MIT
