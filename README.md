# PrefixDOWN

[LevelDB](https://github.com/Level/levelup) partition using prefixed keys, as a LevelDOWN backed by LevelUP.

[![Build Status](https://travis-ci.org/cshum/prefixdown.svg?branch=master)](https://travis-ci.org/cshum/prefixdown)

```bash
npm install prefixdown
```

Unlike Sublevel, PrefixDOWN does not modify, nor set a wrapper on top of current LevelUP instance. 
So that it can be used on any existing LevelUP modules and mostly compatible.

```js
var levelup = require('levelup');
var prefix = require('prefixdown');

var db = levelup('./db'); //root levelup instance
var prefixdown = prefix(db); //wrap with prefixdown factory

//prefixed levelup instances. Location as prefix
var dbA = levelup('!a!', {db: prefixdown });
var dbB = levelup('!b!', {db: prefixdown });

```

## License

MIT
