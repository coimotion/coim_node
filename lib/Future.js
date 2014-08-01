/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var EventEmitter = require('events').EventEmitter;

var  Future = (function()  {
    var  Future = function() {
        this.setError = function(err) {
            this.err = err;
            this.emit('realized');
        };

        this.setResult = function(result)  {
            this.result = result;
            this.emit('realized');
        };

        this.toString = function()  {
            var  str;
            if (this.err)
                str = 'Error:\n' + JSON.stringify(this.err);
            else
                str = JSON.stringify(this.result);
            return  str;
        }
    };

    Future.prototype.__proto__ = EventEmitter.prototype;
    return  Future;
})();

module.exports = Future;
