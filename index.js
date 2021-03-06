var abs = require('abstract-leveldown')
var inherits = require('util').inherits
var xtend = require('xtend')
var iterate = require('stream-iterate')

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

function PrefixIterator (db, prefix, options) {
  abs.AbstractIterator.call(this)

  var opts = ltgt(prefix, encoding(options))

  // should emit key value object
  opts.keys = true
  opts.values = true

  this._opts = opts
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
    var key = data.key.slice(self._len)
    var value = data.value
    if (typeof key === 'string' && self._opts.keyAsBuffer) {
      key = new Buffer(key)
    }
    if (typeof key === 'string' && self._opts.valueAsBuffer) {
      value = new Buffer(value)
    }
    cb(err, key, value)
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

function isLevelUP (db) {
  return db && (
    db.toString() === 'LevelUP' ||
    typeof db.sublevel === 'function'
  )
}

function PrefixDOWN (levelup, location) {
  if (isLevelUP(levelup)) {
    if (arguments.length === 1) {
      // LeveUP defined factory
      return function (location) {
        return PrefixDOWN(levelup, location)
      }
    }
  } else if (typeof levelup === 'string') {
    location = levelup
    levelup = null
  }

  if (!(this instanceof PrefixDOWN)) return new PrefixDOWN(levelup, location)

  this.db = levelup
  abs.AbstractLevelDOWN.call(this, location)
}

inherits(PrefixDOWN, abs.AbstractLevelDOWN)

PrefixDOWN.prototype._getPrefix = function (options) {
  // handle prefix options
  if (options && options.prefix) {
    var prefix = options.prefix
    // no prefix for root db
    if (prefix === this.db) return ''
    // string prefix
    if (typeof prefix === 'string') return prefix
    // levelup of prefixdown prefix
    if (isLevelUP(prefix)) {
      // levelup v2
      if (prefix._db instanceof PrefixDOWN) return prefix._db.location
      // levelup v1
      if (prefix.options && prefix.options.db) return prefix.location
    }
  }
  return this.location
}

PrefixDOWN.prototype._open = function (options, callback) {
  this.db = this.db || options.levelup
  if (!isLevelUP(this.db)) {
    return callback(new Error('db must be a LevelUP instance.'))
  }
  process.nextTick(callback)
}

PrefixDOWN.prototype._put = function (key, value, options, cb) {
  if (value === null || value === undefined) {
    value = options.asBuffer ? Buffer(0) : ''
  }
  this.db.put(concat(this.location, key), value, encoding(options), cb)
}

PrefixDOWN.prototype._get = function (key, options, cb) {
  this.db.get(concat(this.location, key), encoding(options), cb)
}

PrefixDOWN.prototype._del = function (key, options, cb) {
  this.db.del(concat(this.location, key), encoding(options), cb)
}

PrefixDOWN.prototype._batch = function (operations, options, cb) {
  if (arguments.length === 0) return new abs.AbstractChainedBatch(this)
  if (!Array.isArray(operations)) return this.db.batch.apply(null, arguments)

  var ops = new Array(operations.length)
  for (var i = 0, l = operations.length; i < l; i++) {
    var o = operations[i]
    var isValBuf = Buffer.isBuffer(o.value)
    var isKeyBuf = Buffer.isBuffer(o.key)
    ops[i] = {
      type: o.type,
      key: concat(this._getPrefix(o), o.key),
      value: isValBuf ? o.value : String(o.value),
      keyEncoding: isKeyBuf ? 'binary' : 'utf8',
      valueEncoding: isValBuf ? 'binary' : 'utf8'
    }
  }
  this.db.batch(ops, options, cb)
}

PrefixDOWN.prototype._iterator = function (options) {
  return new PrefixIterator(this.db, this.location, options)
}

PrefixDOWN.prototype._isBuffer = function (obj) {
  return Buffer.isBuffer(obj)
}

PrefixDOWN.destroy = function (db, prefix, options, cb) {
  if (typeof options === 'function') cb = options

  var read = iterate(db.createKeyStream(ltgt(prefix, { keyEncoding: 'utf8' })))
  function loop () {
    read(function (err, key, next) {
      if (err) return cb(err)
      if (!key) return cb(null)
      db.del(key, { keyEncoding: 'utf8' }, function (err) {
        if (err) return cb(err)
        next()
        loop()
      })
    })
  }
  loop()
}

module.exports = PrefixDOWN
