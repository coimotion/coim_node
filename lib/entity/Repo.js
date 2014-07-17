/*!
 * coServ
 * authors: Hungyu Su
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
 var  coim = require('../lib/coim');
 coim.init();

 var  repoPool = {},
      createAPIs = {},
      findAPIs = {};

 var  Repo = (function() {
     var  entyPool = {};

     var  Repo = function Repo(repoCode)  {
         this.repoCode = repoCode;
     };

     Repo.prototype = {
        createEnty: function createEnty(name, data, callback) {
            var  api = this.repoCode + '/' + createAPIs[name];
            apiSend( api, data, function(err, rtnData) {
                if (err)
                    callback( err );
                else  {
                    var  enty = new Entity(this, name, data);
                    callback( null, entyPool[key] = enty );
                }
            });
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
        }
     };

     return  Repo;
 })();


 exports.getRepo = function getRepo(repoCode) {
     var  repo = repoPool[repoCode];
     if (repo === undefined)  {
         // TODO: should check if the repo is a valid one
         repo = new Repo(repoCode);
         repoPool[repoCode] = repo;
     }

     return  repo;
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
