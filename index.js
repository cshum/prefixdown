var abs = require('abstract-leveldown')
var inherits = require('util').inherits
var xtend = require('xtend')
var iterate = require('stream-iterate')
var through = require('through2')

var END = '\uffff'

function concat (prefix, key) {
  if (typeof key === 'string') {
    return prefix + key
  }
  if (Buffer.isBuffer(key)) {
    return Buffer.concat([Buffer(prefix), key])
  }
  return prefix + String(key)
}

function encoding (o) {
  return xtend(o, {
    keyEncoding: o.keyAsBuffer ? 'binary' : 'utf8',
    valueEncoding: (o.asBuffer || o.valueAsBuffer) ? 'binary' : 'utf8'
  })
}

function ltgt (prefix, x) {
  var r = !!x.reverse
  var at = {};

  ['lte', 'gte', 'lt', 'gt', 'start', 'end'].forEach(function (key) {
    at[key] = x[key]
    delete x[key]
  })

  if (at.gte) x.gte = concat(prefix, at.gte)
  else if (at.gt) x.gt = concat(prefix, at.gt)
  else if (at.start && !r) x.gte = concat(prefix, at.start)
  else if (at.end && r) x.gte = concat(prefix, at.end)
  else x.gte = at.keyAsBuffer ? Buffer(prefix) : prefix

  if (at.lte) x.lte = concat(prefix, at.lte)
  else if (at.lt) x.lt = concat(prefix, at.lt)
  else if (at.end && !r) x.lte = concat(prefix, at.end)
  else if (at.start && r) x.lte = concat(prefix, at.start)
  else x.lte = concat(prefix, at.keyAsBuffer ? Buffer(END) : END)

  return x
}

module.exports = function prefixFactory (db) {
  // db is levelup instance
  if (!db || db.toString() !== 'LevelUP') {
    throw new Error('db must be a LevelUP instance.')
  }

  // reuse prefixdown
  if (db._prefixdown) return db._prefixdown

  function PrefixIterator (prefix, options) {
    abs.AbstractIterator.call(this)

    var opts = ltgt(prefix, encoding(options))

    // should emit key value object
    opts.keys = true
    opts.values = true

    this._stream = db.createReadStream(opts)
    this._iterate = iterate(this._stream)
    this._len = prefix.length
  }

  inherits(PrefixIterator, abs.AbstractIterator)

  PrefixIterator.prototype._next = function (cb) {
    var self = this
    this._iterate(function (err, data, next) {
      if (err) return cb(err)
      if (!data) return cb()
      next()
      cb(err, data.key.slice(self._len), data.value)
    })
  }

  PrefixIterator.prototype._end = function (cb) {
    if (this._stream && this._stream.destroy) {
      this._stream.destroy()
      delete this._stream
      delete this._iterate
    }
    process.nextTick(cb)
  }

  function PrefixDOWN (prefix) {
    if (!(this instanceof PrefixDOWN)) return new PrefixDOWN(prefix)

    abs.AbstractLevelDOWN.call(this, prefix)

    this.prefix = prefix
  }

  inherits(PrefixDOWN, abs.AbstractLevelDOWN)

  PrefixDOWN.prototype._getPrefix = function (options) {
    // handle prefix options
    if (options && options.prefix) {
      var prefix = options.prefix
      // no prefix for root db
      if (prefix === db) return ''
      // string prefix
      if (typeof prefix === 'string') return prefix
      // levelup of prefixdown prefix
      // levelup v2
      if (prefix._db instanceof PrefixDOWN) return prefix._db.location
      // levelup v1
      if (prefix.options && prefix.options.db === PrefixDOWN) return prefix.location
    }
    return this.prefix
  }

  PrefixDOWN.prototype._put = function (key, value, options, cb) {
    if (value === null || value === undefined) {
      value = options.asBuffer ? Buffer(0) : ''
    }
    db.put(concat(this.prefix, key), value, encoding(options), cb)
  }

  PrefixDOWN.prototype._get = function (key, options, cb) {
    db.get(concat(this.prefix, key), encoding(options), cb)
  }

  PrefixDOWN.prototype._del = function (key, options, cb) {
    db.del(concat(this.prefix, key), encoding(options), cb)
  }

  PrefixDOWN.prototype._batch = function (operations, options, cb) {
    if (arguments.length === 0) return new abs.AbstractChainedBatch(this)
    if (!Array.isArray(operations)) return db.batch.apply(null, arguments)

    var ops = new Array(operations.length)
    for (var i = 0, l = operations.length; i < l; i++) {
      var o = operations[i]
      var isValBuf = Buffer.isBuffer(o.value)
      var isKeyBuf = Buffer.isBuffer(o.key)
      ops[i] = xtend(o, {
        type: o.type,
        key: concat(this._getPrefix(o), o.key),
        value: isValBuf ? o.value : String(o.value),
        keyEncoding: isKeyBuf ? 'binary' : 'utf8',
        valueEncoding: isValBuf ? 'binary' : 'utf8'
      })
    }
    db.batch(ops, options, cb)
  }

  PrefixDOWN.prototype._iterator = function (options) {
    return new PrefixIterator(this.prefix, options)
  }

  PrefixDOWN.prototype._isBuffer = function (obj) {
    return Buffer.isBuffer(obj)
  }

  PrefixDOWN.destroy = function (prefix, options, cb) {
    if (typeof options === 'function') {
      cb = options
    }
    db.createKeyStream(ltgt(prefix, { keyEncoding: 'utf8' }))
    .pipe(through.obj(
      function (key, _, next) {
        db.del(key, { keyEncoding: 'utf8' }, next)
      },
      function (next) {
        cb(null)
        next()
      }
    ))
    .on('error', cb)
  }

  db._prefixdown = PrefixDOWN

  return PrefixDOWN
}
