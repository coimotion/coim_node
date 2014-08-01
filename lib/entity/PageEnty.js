/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  coim = require('../coim'),
     Entity = require('./Entity.js'),
     ErrCode = require('./ErrCode.js'),
     Future = require('../Future');

var  PageEnty = (function() {
    var  PageEnty = function(repo, name, data) {
        this.constructor.super(repo);

        this.__name = name;

        for (var k in data)  {
            if (data.hasOwnProperty(k))  {
                this[k] = data[k];
            }
        }

        this.nameId = function()  {
            var  master = this.getMaster(),
                 rsName,
                 id;

            if (master)  {
                rsName = master.name + '.page';
                id = master.id + '.' + this.getId();
            }
            else  {
                rsName = name;
                id = this.getId();
            }

            return  {name: rsName, id: id};
        };

        this.getId = function()  {
            return  this.ngID;
        };


        this.attach = function(params, files, callback)  {
            var  nid = this.nameId(),
                 apiPath = repo.repoCode + '/' + nid.name + '/attach/' + nid.id;

            coim.attach(apiPath, params, files, function(result) {
                callback( null, result );
            },
            function(err) {
                callback( err );
            });
        };


        this.unattach = function(cnID, callback)  {
            var  master = this.getMaster(),
                 rsName,
                 id;

            if (master)  {
                rsName = master.name + '.page';
                id = master.id + '.' + cnID;
            }
            else  {
                rsName = name;
                id = cnID;
            }

            var  apiPath = rsName + '/unattach/' + id;
            repo.api(apiPath, {}, callback);
        };


        this.listAux = function(nType, callback)  {
            if (typeof nType !== 'number')
                return  reportError(ErrCode.NTYPE_FORMAT, callback);
            else  if (nType < 1 || (nType > 5 && nType != 10))
                return  reportError(ErrCode.NTYPE_FORMAT, callback);
            else  {
                var  nid = this.nameId(),
                     apiPath = nid.name + '/listAux/' + nid.id;

                repo.api(apiPath, {nType: nType}, callback);
            }
        };


        this.tag = function(twords, callback)  {
            if (typeof twords === 'string')
                twords = [twords];

            var  nid = this.nameId(),
                 apiPath = nid.name + '/tag/' + nid.id;
            repo.api(apiPath, {tag: twords}, callback);
        };


        this.untag = function(twords, callback)  {
            if (typeof twords === 'string')
                twords = [twords];

            var  nid = this.nameId(),
                 apiPath = nid.name + '/tag/' + nid.id;
            repo.api(apiPath, {tag: twords, remove: 1}, callback);
        };


        this.addGeo = function(geData, callback)  {
            var  master = this.getMaster();

            if (master)
                // if this is a sub-entity, it's not allowed to dig further
                return  reportError(ErrCode.SUBENTITY_NOT_ALLOWED, callback);
            else  {
                var  subName = this.__name + '.geoLoc';
                geData.id = this.getId();
                return  repo.createEnty(subName, geData, callback);
            }
        };


        /* find the geo-location attached to this page */
        this.findGeo = function(id, callback)  {
            var  master = this.getMaster();

            if (master)
                // if this is a sub-entity, it's not allowed to dig furture
                return  reportError(ErrCode.SUBENTITY_NOT_ALLOWED, callback);
            else  {
                var  subName = this.__name + '.geoLoc',
                     subId = this.getId() + '.' + id;
                return  repo.findEnty(subName, subId, callback);
            }
        };
    };

    inherit(PageEnty);
    return  PageEnty;
})();

module.exports = PageEnty;


function  reportError(code, callback)  {
    var  future = null,
         err = ErrCode.toError(code);

    if (callback)
        callback( err );
    else  {
        future = new Future();
        future.setError( err );
    }

    return  future;
};


function inherit(cls) {
    var construct = function () {};
    construct.prototype = Entity.prototype;
    cls.prototype = new construct;
    cls.prototype.constructor = cls;
    cls.super = Entity;
};
