/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  async = require('async'),
     coim = require('../coim');

var  repoPool = {};

//var  NO_SUCH_RS = -2000;

var  Repo = (function() {
    var  entyPool = {},
         entyNames,    // an array
         createAPIs = {},
         findAPIs = {};

    var  Repo = function Repo(repoCode, data)  {
        this.repoCode = repoCode;
        entyNames = data.rsList;
    };

    Repo.prototype = {
        createEnty: function createEnty(name, data, callback) {
            if (entyNames.indexOf(name) < 0)
                callback({errCode: exports.NO_SUCH_RS, message: 'No such resource.'});
            else  {
                var  api = this.repoCode + '/' + createAPIs[name];
                apiSend( api, data, function(err, rtnData) {
                    if (err)
                        callback( err );
                    else  {
                        var  enty = new Entity(this, name, data);
                        callback( null, entyPool[key] = enty );
                    }
                });
            }
        },

        deleteEnty: function deleteEnty(enty, callback)  {
            var  api = this.repoCode + '/' + name + '/delete/' + enty.getId();
            apiSend( api, enty.getRawData(), function(err) {
                if (err)
                    callback( err );
                else  {
                    var  key = name + '.' + id;
                    delete  entyPool[key];
                    callback();
                }
            });
        },

        findEnty: function findEnty(name, id, callback) {
            if (entyNames.indexOf(name) < 0)
                callback({errCode: exports.NO_SUCH_RS, message: 'No such resource.'});
            else  {
                var  key = name + '.' + id,
                     enty = entyPool[key];

                if (enty === undefined)  {
                    var  api = this.repoCode + '/' + findAPIs[name] + '/' + id;
                    apiSend( api, {}, function(err, data) {
                        if (err)
                            callback( err );
                        else  {
                            var  enty = new Entity(this, name, data);
                            callback( null, entyPool[key] = enty );
                        }
                    });
                }
            }
        },

        saveEnty: function saveEnty(enty, callback)  {
            var  api = this.repoCode + '/' + name + '/update/' + enty.getId();
            apiSend( api, enty.getRawData(), function(err) {
                if (err)
                    callback( err );
                else  {
                    var  key = name + '.' + id;
                    delete  entyPool[key];        // is this necessary?
                    callback();
                }
            });
        },

        setCreatePath: function setCreatePath(rsCode, path)  {
            createAPIs[rsCode] = path;
        },

        setFindPath: function setFindPath(rsCode, path)  {
            findAPIs[rsCode] = path;
        }
    };

    return  Repo;
 })();


exports.getRepo = function getRepo(repoCode, callback) {
    var  repo = repoPool[repoCode];

    if (repo === undefined)  {
        var  api = 'core/repo/info/' + repoCode;
        apiSend( api, {}, function(err, data) {
            if (err)
                callback( err );
            else  {
                repo = new Repo(repoCode, data);

                async.each( data.rsList, function(rsCode, callback) {
                    var  rsAPI = 'core/rs/info/' + repoCode + '.' + rsCode;
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
                    if (err)
                        callback( err );
                    else  {
                        repoPool[repoCode] = repo;
                        callback(null, repo);
                    }
                });
            }
        });
    }
    else
        callback( null, repo );
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
