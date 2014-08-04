/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */

var  Entity = (function() {
    var  entyRepo;

    var  Entity = function Entity(repo, name, data)  {
        setRepo(repo);

        if (name)
            this.__name = name;

        if (data)
            for (var k in data)  {
                if (data.hasOwnProperty(k))  {
                    this[k] = data[k];
                    //console.log( this[k] );
                }
            }
    };

    function  setRepo(repo)  {
        entyRepo = repo;
    };

    Entity.prototype = {
        /* This method should be overwritten */
        getId: function getId()  {
            return  '';
        },

        getFields: function getFields()  {
            return  [];
        },

        nameId: function nameId()  {
            return  {name: this.__name, id: this.getId()}
        },

        save: function save(callback) {
            return  entyRepo.saveEnty( this, callback );
        },

        del: function(callback)  {
            return  entyRepo.deleteEnty( this, callback );
        },

        getMaster: function()  {
            return  this.masterName  ?  {name: this.masterName, id: this.masterId} : null;
        },

        setMaster: function(name, id)  {
            this.masterName = name;
            this.masterId = id;
        }
     };

     return  Entity;
 })();

module.exports = Entity;
