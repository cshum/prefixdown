# PrefixDOWN

LevelDB partition using prefixed keys, as a LevelDOWN backed by LevelUP.

```bash
npm install prefixdown
```

Unlike Sublevel, PrefixDOWN does not modify, nor set a wrapper on top of current LevelUP instance. So that it can be used on many existing LevelUP modules.

```js
var levelup = require('levelup');
var prefixdown = require('prefixdown');

var db = levelup('./db'); //root levelup instance
var prefix = prefixdown(db);

//prefixed levelup instances. Location as prefix
var dbA = levelup('!a!', {db: prefix });
var dbB = levelup('!b!', {db: prefix });

```

## License

MIT
