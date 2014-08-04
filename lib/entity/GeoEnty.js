/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  Entity = require('./Entity.js');

var  GeoEnty = (function() {
    var  GeoEnty = function(repo, name, data) {
        this.constructor.super(repo);

        this.__name = name;

        for (var k in data)  {
            if (data.hasOwnProperty(k))
                this[k] = data[k];
        }

        this.getId = function()  {
            return  this.geID;
        };

        this.nameId = function()  {
            var  master = this.getMaster(),
                 rsName,
                 id;

            if (master)  {
                rsName = master.name + '.geoLoc';
                id = master.id + '.' + this.getId();
            }
            else  {
                rsName = name;
                id = this.getId();
            }

            return  {name: rsName, id: id};
        };


        this.getFields = function()  {
            return  ['addr', 'zip', 'aux', 'pri'];
        };


        this.tag = function(twords, callback)  {
            if (typeof twords === 'string')
                twords = [twords];

            var  master = this.getMaster(),
                 apiPath;

            if (master)
                apiPath = master.name + '.geoLoc/tag/' + master.id + '.' + this.getId();
            else
                apiPath = name + '/tag/' + this.getId();

            repo.api(apiPath, {tag: twords}, callback);
        };


        this.untag = function(twords, callback)  {
            if (typeof twords === 'string')
                twords = [twords];

            var  master = this.getMaster(),
                 apiPath;

            if (master)
                apiPath = master.name + '.geoLoc/tag/' + master.id + '.' + this.getId();
            else
                apiPath = name + '/tag/' + this.getId();

            repo.api(apiPath, {tag: twords, remove: 1}, callback);
        };


        this.createPage = function(pgData, callback)  {
            var  master = this.getMaster();

            if (master)
                // if this is a sub-entity, it's not allowed to dig further
                return  reportError(ErrCode.SUBENTITY_NOT_ALLOWED, callback);
            else  {
                var  subName = this.__name + '.page';
                pgData.id = this.getId();
                return  repo.createEnty(subName, pgData, callback);
            }
        };


        /* find the geo-location attached to this page */
        this.findPage = function(id, callback)  {
            var  master = this.getMaster();

            if (master)
                // if this is a sub-entity, it's not allowed to dig furture
                return  reportError(ErrCode.SUBENTITY_NOT_ALLOWED, callback);
            else  {
                var  subName = this.__name + '.page',
                     subId = this.getId() + '.' + id;
                return  repo.findEnty(subName, subId, callback);
            }
        };


        /* list pages of a geo-location */
        this.listPages = function(params, callback)  {
            var  master = this.getMaster();

            if (master)
                // if this is a sub-entity, it's not allowed to dig furture
                return  reportError(ErrCode.SUBENTITY_NOT_ALLOWED, callback);
            else  {
                var  apiPath = this.__name + '.page/list/' + this.getId();
                repo.api(apiPath, params, callback);
            }
        };
    };

    inherit(GeoEnty);
    return  GeoEnty;
})();

module.exports = GeoEnty;


function inherit(cls) {
    var construct = function () {};
    construct.prototype = Entity.prototype;
    cls.prototype = new construct;
    cls.prototype.constructor = cls;
    cls.super = Entity;
};
