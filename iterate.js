var through = require('through2')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

function Iterate (stream) {
  if (!(this instanceof Iterate)) return new Iterate(stream)

  EventEmitter.call(this)
  this._cb = null

  var self = this
  stream
  .on('error', function (err) {
    if (self._cb) {
      self._cb(err)
    } else {
      self.once('callback', function () {
        self._cb(err)
      })
    }
  })
  .pipe(through.obj(function (data, _, next) {
    if (self._cb) {
      self._cb(null, data)
      self._cb = null
      next()
    } else {
      self.once('callback', function () {
        self._cb(null, data)
        self._cb = null
        next()
      })
    }
  }, function (next) {
    if (self._cb) {
      self._cb()
      next()
    } else {
      self.once('callback', function () {
        self._cb()
        next()
      })
    }
  }))
}

inherits(Iterate, EventEmitter)

Iterate.prototype.next = function (cb) {
  this._cb = cb
  this.emit('callback')
}
module.exports = Iterate
