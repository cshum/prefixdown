# PrefixDOWN

LevelDB sections using key prefix as a [LevelUP](https://github.com/Level/levelup) backend.

[![Build Status](https://travis-ci.org/cshum/prefixdown.svg?branch=master)](https://travis-ci.org/cshum/prefixdown)

```bash
npm install prefixdown
```

By exposing a [LevelDOWN](https://github.com/Level/abstract-leveldown) compatible module, PrefixDOWN does not modify, nor set a wrapper on top of current LevelUP instance. 
So that it can be used on any existing LevelUP based libraries.

```js
var levelup = require('levelup');
var prefix = require('prefixdown');

var db = levelup('./db'); //root levelup instance
var prefixdown = prefix(db); //prefixdown factory

//prefix as location
var dbA = levelup('!a!', {db: prefixdown });
var dbB = levelup('!b!', {db: prefixdown });

dbA.put('foo', 'bar', function(){
  dbB.put('foo', 'foo', function(){
    db.createReadStream().on('data', function(data){
      //Results from root db
      {key: '!a!foo', value: 'bar'}, 
      {key: '!b!foo', value: 'foo'}
    });
  });
});

```

## License

MIT
