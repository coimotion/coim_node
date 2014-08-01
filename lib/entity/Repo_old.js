/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  async = require('async'),
     coim = require('../coim'),
     Entity = require('./Entity'),
     Future = require('../Future'),
     PageEnty = require('./PageEnty');

var  repoPool = {};

//var  NO_SUCH_RS = -2000;

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
    };

    Repo.prototype.createEnty = function createEnty(name, data, callback) {
            var  future = callback  ?  null : new Future();
            if (entyNames.indexOf(name) < 0)  {
                var  err = {errCode: exports.NO_SUCH_RS, message: 'No such resource.'};
                if (callback)
                    callback(err);
                else
                    future.setError( err );
            }
            else  {
                var  api = this.repoCode + '/' + name + '/' + createAPIs[name];
                apiSend( api, data, function(err, rtnData) {
                    if (err)  {
                        if (callback)
                            callback( err );
                        else
                            future.setError( err );
                    }
                    else  {
                        var  enty;
                        if (entyType[name] === 'page')
                            enty = new PageEnty(this, name, data);
                        else
                            enty = new Entity(this, name, data);
                        entyPool[name + '.' + data.ngID] = enty;

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
                 api = this.repoCode + '/' + enty.__name + '/delete/' + enty.getId();

            apiSend( api, enty.getRawData(), function(err) {
                if (err)  {
                    if (callback)
                        callback( err );
                    else
                        future.setError( err );
                }
                else  {
                    var  key = enty.__name + '.' + id;
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
            var  future = callback  ?  null : new Future();

            if (entyNames.indexOf(name) < 0)  {
                var  err = {errCode: exports.NO_SUCH_RS, message: 'No such resource.'};
                if (callback)
                    callback(err);
                else
                    future.setError( err );
            }
            else  {
                var  key = name + '.' + id,
                     enty = entyPool[key];

                if (enty === undefined)  {
                    var  api = this.repoCode + '/' + name + '/' + findAPIs[name] + '/' + id;
                    apiSend( api, {}, function(err, data) {
                        if (err)  {
                            if (callback)
                                callback(err);
                            else
                                future.setError( err );
                        }
                        else  {
                            var  enty;
                            if (entyType[name] === 'page')  {
                                enty = new PageEnty(Repo.prototype, name, data);
                            }
                            else
                                enty = new Entity(Repo.prototype, name, data);
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
                 api = this.repoCode + '/' + enty.__name + '/update/' + enty.getId();

            apiSend( api, enty, function(err) {
                if (err)  {
                    if (callback)
                        callback(err);
                    else
                        future.setError( err );
                }
                else  {
                    var  key = enty.__name + '.' + id;
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
                future.setError( err );
            }
            else  {
                repo = new Repo(repoCode, data);

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
