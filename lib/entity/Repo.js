/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  async = require('async'),
     Entity = require('./Entity'),
     Future = require('../Future'),
     GeoEnty = require('./GeoEnty'),
     PageEnty = require('./PageEnty'),
     Promise = require('bluebird');

var  coim,
     repoPool = {};

//var  NO_SUCH_RS = -2000;

// let's make some promise
Promise.promisifyAll(PageEnty);

var  Repo = (function() {
    var  entyPool = {},
         entyNames = [],
         entyType = {},
         createAPIs = {},
         findAPIs = {};

    var  Repo = function Repo(repoCode, data)  {
        this.repoCode = repoCode;

        for (var i in data.rsList)  {
            var  rs = data.rsList[i];
            entyNames.push( rs.rsCode );
            entyType[rs.rsCode] = rs.type;
        }

        this.clear = function()  {
            entyPool = undefined;
        };
    };

    Repo.prototype.createEnty = function createEnty(name, data, callback) {
        var  future = callback  ?  null : new Future(),
             thisRepo = this,
             masterName = name,
             subName = name,
             idx = name.indexOf('.'),
             isCombo = false;

        if (idx > 0)  {
            masterName = name.substring(0, idx);
            subName = name.substring(idx+1);
            isCombo = true;
        }

        if (entyNames.indexOf(masterName) < 0)  {
            var  err = {errCode: exports.NO_SUCH_RS, message: 'No such resource.'};
            if (callback)
                callback(err);
            else
                future.setError( err );
        }
        else  {
            var  createOp;
            if (subName === 'page')
                createOp = 'create';
            else  if (subName === 'geoLoc')
                createOp = 'add';
            else
                createOp = createAPIs[name];

            var  api = this.repoCode + '/' + name + '/' + createOp;
            if (isCombo)
                api += '/' + data.id;

            apiSend( api, data, function(err, rtnData) {
                if (err)  {
                    if (callback)
                        callback( err );
                    else
                        future.setError( err );
                }
                else  {
                    var  enty;
                    if (entyType[name] === 'page' || subName === 'page')  {
                        data.ngID = rtnData.id;
                        enty = new PageEnty(thisRepo, name, data);
                    }
                    else  if (entyType[name] === 'geoLoc' || subName === 'geoLoc')  {
                        data.geID = rtnData.id;
                        enty = new GeoEnty(thisRepo, name, data);
                    }
                    else
                        enty = new Entity(thisRepo, name, data);

                    var  comboId = rtnData.id;
                    if (isCombo)  {
                        enty.setMaster(masterName, data.id);
                        comboId =  data.id + '.' + comboId;
                    }

                    Promise.promisifyAll(enty);
                    entyPool[name + '/' + comboId] = enty;

                    if (callback)
                        callback( null, enty );
                    else
                        future.setResult( enty );
                }
            });
        }
        return  future;
    };

    Repo.prototype.deleteEnty = function deleteEnty(enty, callback)  {
        var  future = callback  ?  null : new Future(),
             nid = enty.nameId(),
             api = this.repoCode + '/' + nid.name + '/delete/' + nid.id;

        apiSend( api, {}, function(err) {
            if (err)  {
                if (callback)
                    callback( err );
                else
                    future.setError( err );
            }
            else  {
                var  key = nid.name + '/' + nid.id;
                delete  entyPool[key];

                if (callback)
                    callback();
                else
                    future.setError( null );
            }
        });

        return  future;
    };

    Repo.prototype.findEnty = function findEnty(name, id, callback) {
        var  future = callback  ?  null : new Future(),
             masterName = name,
             subName = name,
             idx = name.indexOf('.'),
             isCombo = false;

        if (idx > 0)  {
            masterName = name.substring(0, idx);
            subName = name.substring(idx+1);
            isCombo = true;
        }

        if (entyNames.indexOf(masterName) < 0)  {
            var  err = {errCode: exports.NO_SUCH_RS, message: 'No such resource.'};
            if (callback)
                callback(err);
            else
                future.setError( err );
        }
        else  {
            var  key = name + '/' + id,
                 enty = entyPool[key];

            if (enty === undefined)  {
                var  findOp;
                if (subName === 'page')
                    findOp = 'view';
                else  if (subName === 'geoLoc')
                    findOp = 'info';
                else
                    findOp = findAPIs[name];

                var  api = this.repoCode + '/' + name + '/' + findOp + '/' + id,
                     thisRepo = this;

                apiSend( api, {}, function(err, data) {
                    if (err)  {
                        if (err.errCode === 1)  {
                            // no such entity
                            entyPool[key] = null;
                            if (callback)
                                callback( null, null );
                            else
                                future.setResult( null );
                        }
                        else  {
                            if (callback)
                                callback(err);
                            else
                                future.setError( err );
                        }
                    }
                    else  {
                        var  enty;
                        if (entyType[name] === 'page' || subName === 'page')
                            enty = new PageEnty(thisRepo, name, data);
                        else  if (entyType[name] === 'geoLoc' || subName === 'geoLoc')
                            enty = new GeoEnty(thisRepo, name, data);
                        else
                            enty = new Entity(thisRepo, name, data);

                        if (isCombo)  {
                            idx = id.indexOf('.');
                            enty.setMaster(masterName, id.substring(0, idx));
                        }

                        Promise.promisifyAll(enty);
                        entyPool[key] = enty;

                        if (callback)
                            callback( null, enty );
                        else
                            future.setResult( enty );
                    }
                });
            }
            else  {
                if (callback)
                    callback( null, enty );
                else
                    future.setResult( enty );
            }
        }
        return  future;
    };

    Repo.prototype.saveEnty = function saveEnty(enty, callback)  {
        var  future = callback  ?  null : new Future(),
             nid = enty.nameId(),
             api = this.repoCode + '/' + nid.name + '/update/' + nid.id,
             updData = {};

        // now, let's prepare data to be saved (not every property in entity is savable)
        var  fields = enty.getFields();
        for (var i in fields)  {
            var  key = fields[i];
            updData[key] = enty[key];
        }

        apiSend( api, enty, function(err) {
            if (err)  {
                if (callback)
                    callback(err);
                else
                    future.setError( err );
            }
            else  {
                var  key = nid.name + '/' + nid.id;
                delete  entyPool[key];        // is this necessary?

                if (callback)
                    callback();
                else
                    future.setError( null );
            }
        });

        return  future;
    };

    Repo.prototype.listEnties = function listEnties(name, params, callback)  {
        if (arguments.length === 1)
            params = {};
        else  if (arguments.length === 2)  {
            var  lastArg = arguments[1];
            if (typeof lastArg === 'function')  {
                callback = lastArg;
                params = {};
            }
        }

        var  future = callback  ?  null : new Future();

        if (entyNames.indexOf(name) < 0)  {
            var  err = {errCode: exports.NO_SUCH_RS, message: 'No such resource.'};
            if (callback)
                callback(err);
            else
                future.setError( err );
        }
        else  {
            var  api = this.repoCode + '/' + name + '/list';

            apiSend( api, params, function(err, data) {
                if (callback)
                    callback(err, data);
                else  {
                    if (err)
                        future.setError( err );
                    else
                        future.setResult( data );
                }
            });
        }
        return  future;
    };

    Repo.prototype.api = function(apiPath, params, callback) {
        apiPath = this.repoCode + '/' + apiPath;
        apiSend(apiPath, params, callback);
    };

    Repo.prototype.setCreatePath = function setCreatePath(rsCode, path)  {
        createAPIs[rsCode] = path;
    };

    Repo.prototype.setFindPath = function setFindPath(rsCode, path)  {
        findAPIs[rsCode] = path;
    };

    return  Repo;
})();


exports.getRepo = function getRepo(repoCode, callback) {
    var  repo = repoPool[repoCode];

    if (repo === undefined)  {
        var  api = 'core/repo/info/' + repoCode,
             future = callback  ?  null : new Future();

        apiSend( api, {}, function(err, data) {
            if (err)  {
                if (callback)
                    callback( err );
                else
                    future.setError( err );
            }
            else  {
                repo = new Repo(repoCode, data);
                Promise.promisifyAll(repo);

                async.each( data.rsList, function(rs, callback) {
                    var  rsCode = rs.rsCode,
                         rsAPI = 'core/rs/info/' + repoCode + '.' + rsCode;
                    apiSend( rsAPI, {}, function(err, rsMeta) {
                        if (err)
                            callback( err );
                        else  {
                            repo.setCreatePath( rsCode, rsMeta.createOp );
                            repo.setFindPath( rsCode, rsMeta.infoOp );
                            callback();
                        }
                    });
                },
                function(err) {
                    if (err)  {
                        if (callback)
                            callback( err );
                        else
                            future.setError( err );
                    }
                    else  {
                        repoPool[repoCode] = repo;
                        if (callback)
                            callback(null, repo);
                        else
                            future.setResult( repo );
                    }
                });
            }
        });

        return  future;
    }
    else  {
        if (callback)
            callback( null, repo );
        else
            return  {result: repo};
    }
};


exports.releaseRepo = function releaseRepo(repo)  {
    delete  repoPool[repo.repoCode];
    repo.clear();
};


exports.setSDK = function setSDK(sdk)  {
    coim = sdk;
};


function  apiSend(apiPath, params, callback)  {
    coim.send(apiPath, params, function(result) {
        if (result.errCode === 0)
            callback( null, result.value );
        else
            callback( result );
    },
    function(err) {
        callback( err );
    });
};

function  defineConstant(name, v)  {
	Object.defineProperty(exports, name, {
		value: v,
		enumerable: true
	});
};

defineConstant("NO_SUCH_RS", -2000);

Promise.promisifyAll(exports);
