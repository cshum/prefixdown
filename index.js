var abs          = require('abstract-leveldown'),
    inherits     = require('util').inherits,
    xtend        = require('xtend'),
    iterate      = require('stream-iterate'),
    setImmediate = global.setImmediate || process.nextTick;

function concat(prefix, key) {
  if (typeof key === 'string') 
    return prefix + key;
  if (Buffer.isBuffer(key)) 
    return Buffer.concat([Buffer(prefix), key]);
  return prefix + JSON.stringify(key);
}

function encoding(o) {
  return xtend(o, {
    keyEncoding: o.keyAsBuffer ? 'binary' : 'utf8',
    valueEncoding: (o.asBuffer || o.valueAsBuffer) ? 'binary' : 'utf8'
  });
}

function ltgt(prefix, at){
  if('gte' in at) at.gte = concat(prefix, at.gte);
  else if('gt' in at) at.gt = concat(prefix, at.gt);
  else at.start = at.keyAsBuffer ? Buffer(prefix) : prefix;

  if('lte' in at) at.lte = concat(prefix, at.lte);
  else if('lt' in at) at.lt = concat(prefix, at.lt);
  else at.lt = concat(prefix, at.keyAsBuffer ? Buffer([0xff]) : '\xff') ;

  return at;
}

module.exports = function(db){
  //db is levelup instance

  function PrefixIterator(prefix, options){
    abs.AbstractIterator.call(this, down);

    var opts = ltgt(prefix, encoding(options));

    this._stream = db.createReadStream(opts);
    this._iterate = iterate(this._stream);
    this._len = prefix.length;
  }

  inherits(PrefixIterator, abs.AbstractIterator);

  PrefixIterator.prototype._next = function (cb) {
    var self = this;
    this._iterate(function(err, data, next){
      if(err) return cb(err);
      if(!data) return cb();
      next();
      cb(err, data.key.slice(self._len), data.value);
    });
  };

  PrefixIterator.prototype._end = function(cb){
    if (this._stream.destroy)
      this._stream.destroy();
    setImmediate(cb);
  };

  function PrefixDOWN(prefix){
    if (!(this instanceof PrefixDOWN))
      return new PrefixDOWN(prefix);

    abs.AbstractLevelDOWN.call(this, prefix);

    this.prefix = prefix;
  }

  inherits(PrefixDOWN, abs.AbstractLevelDOWN);

  PrefixDOWN.prototype._open = function (options, cb) {
    var self = this;
    setImmediate(function() { cb(null, self); });
  };

  PrefixDOWN.prototype._put = function (key, value, options, cb) {
    db.put(concat(this.prefix, key), value, encoding(options), cb);
  };

  PrefixDOWN.prototype._get = function (key, options, cb) {
    db.get(concat(this.prefix, key), encoding(options), cb);
  };

  PrefixDOWN.prototype._del = function (key, options, cb) {
    db.get(concat(this.prefix, key), encoding(options), cb);
  };

  PrefixDOWN.prototype._batch = function(operations, options, cb) {
    if (arguments.length === 0) 
      return new abs.AbstractChainedBatch(this);
    if (!Array.isArray(operations)) 
      return db.batch.apply(null, arguments);

    var ops = new Array(operations.length);
    for (var i = 0, l = operations.length; i < l; i++) {
      var o = operations[i];
      ops[i] = xtend(o, {
        type: o.type, 
        key: concat(this.prefix, o.key), 
        value: o.value,
        keyEncoding: typeof o.key === 'string' ? 'utf8':'binary',
        valueEncoding: typeof o.value === 'string' ? 'utf8':'binary'
      });
    }
    db.batch(ops, options, cb);
  };

  PrefixDOWN.prototype._iterator = function (options) {
    return new PrefixIterator(this.prefix, options);
  };

  PrefixDOWN.prototype._isBuffer = function (obj) {
    return Buffer.isBuffer(obj);
  };

  return PrefixDOWN;
};
