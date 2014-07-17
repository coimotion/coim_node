/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  Entity = require('./Entity.js');

var  PageEnty = (function() {
    var  PageEnty = function(repo, name, data)  {
        this.constructor.super(repo, name, data);

        this.getId = function()  {
            return  this.getRawData()['ngID'];
        }
    };

    inherit(PageEnty);
    return  PageEnty;
})();

module.exports = PageEnty;


function inherit(cls) {
    var construct = function () {};
    construct.prototype = Entity.prototype;
    cls.prototype = new construct;
    cls.prototype.constructor = cls;
    cls.super = Entity;
};
