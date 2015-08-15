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
  return prefix + String(key);
}

function encoding(o) {
  return xtend(o, {
    keyEncoding: o.keyAsBuffer ? 'binary' : 'utf8',
    valueEncoding: (o.asBuffer || o.valueAsBuffer) ? 'binary' : 'utf8'
  });
}

function ltgt(prefix, x){
  var r = !!x.reverse;
  var at = xtend(x);
  var START = at.keyAsBuffer ? Buffer(prefix) : prefix;
  var END = concat(prefix, at.keyAsBuffer ? Buffer([0xff]) : '\xff');

  ['lte','gte','lt','gt','start','end'].forEach(function(key){
    delete x[key];
  });

  if(at.gte) 
    x.gte = concat(prefix, at.gte);
  else if(at.gt) 
    x.gt = concat(prefix, at.gt);
  else if(at.start) 
    x[r ? 'end':'start'] = concat(prefix, at.start);
  else 
    x[r ? 'end':'start'] = START;

  if(at.lte) 
    x.lte = concat(prefix, at.lte);
  else if(at.lt) 
    x.lt = concat(prefix, at.lt);
  else if(at.end) 
    x[r ? 'start':'end'] = concat(prefix, at.end);
  else 
    x[r ? 'start':'end'] = END;

  return x;
}

module.exports = function(db){
  //db is levelup instance

  function PrefixIterator(prefix, options){
    abs.AbstractIterator.call(this);

    var opts = ltgt(prefix, encoding(options));
    console.log(opts, options);

    this._stream = db.createReadStream(opts);
    this._read = iterate(this._stream);
    this._len = prefix.length;
  }

  inherits(PrefixIterator, abs.AbstractIterator);

  PrefixIterator.prototype._next = function (cb) {
    var self = this;
    this._read(function(err, data, next){
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

    this.prefix = prefix || '';
  }

  inherits(PrefixDOWN, abs.AbstractLevelDOWN);

  PrefixDOWN.prototype._open = function (options, cb) {
    var self = this;
    setImmediate(function() { cb(null, self); });
  };

  PrefixDOWN.prototype._put = function (key, value, options, cb) {
    if(value === null || value === undefined)
      value = options.asBuffer ? Buffer(0) : '';
    db.put(concat(this.prefix, key), value, encoding(options), cb);
  };

  PrefixDOWN.prototype._get = function (key, options, cb) {
    db.get(concat(this.prefix, key), encoding(options), cb);
  };

  PrefixDOWN.prototype._del = function (key, options, cb) {
    db.del(concat(this.prefix, key), encoding(options), cb);
  };

  PrefixDOWN.prototype._batch = function(operations, options, cb) {
    if (arguments.length === 0) 
      return new abs.AbstractChainedBatch(this);
    if (!Array.isArray(operations)) 
      return db.batch.apply(null, arguments);

    var ops = new Array(operations.length);
    for (var i = 0, l = operations.length; i < l; i++) {
      var o = operations[i];
      var isValBuf = Buffer.isBuffer(o.value);
      var isKeyBuf = Buffer.isBuffer(o.key);
      ops[i] = xtend(o, {
        type: o.type, 
        key: concat(this.prefix, o.key), 
        value: isValBuf ? o.value : String(o.value),
        keyEncoding: isKeyBuf ? 'binary':'utf8',
        valueEncoding: isValBuf ? 'binary':'utf8'
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
