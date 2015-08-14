var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN,
    AbstractIterator  = require('abstract-leveldown').AbstractIterator,
    inherits          = require('util').inherits,
    xtend             = require('xtend'),
    EventEmitter      = require('events').EventEmitter,
    setImmediate      = global.setImmediate || process.nextTick;

module.exports = function(db){
  //db is levelup instance

  function PrefixDOWN(prefix){
    if (!(this instanceof PrefixDOWN))
      return new PrefixDOWN(prefix);

    AbstractLevelDOWN.call(this, prefix);

    this.prefix = prefix;
  }

  inherits(PrefixDOWN, AbstractLevelDOWN);

  PrefixDOWN.prototype._open = function (options, callback) {
    var self = this;
    setImmediate(function() { 
      callback(null, self);
    });
  };

  return PrefixDOWN;
};
