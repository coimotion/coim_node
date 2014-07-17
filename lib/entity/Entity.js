/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */

 var  Entity = (function() {
     var  entyRepo,
          entyData = {};

     var  Entity = function Entity(repo, name, data)  {
         entyRepo = repo;
         this.name = name;

         for (var k in data)  {
             if (data.hasOwnProperty(k))
                 entyData[k] = data[k];
         }
     };

     Entity.prototype = {
        /* This method should be overwritten */
        getId: function getId()  {
            return  '';
        },

        getRawData: function getRawData()  {
            return  entyData;
        },

        save: function save(callback) {
            entyRepo.saveEnty( this, callback );
        },

        remove: function(callback)  {
            entyRepo.deleteEnty( this, callback );
        }
     };

     return  Entity;
 })();

module.exports = Entity;
