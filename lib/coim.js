var sha1 = require("./sha1.js"),
    fs = require("fs"),
    http = require("http"),
    mime = require("./mime.js");
var coimCallback = (function() {
                        function cb()  {
                            cb.prototype.success = function(obj) {
                                console.log("proto success: " + obj['message']);
                            };
                            cb.prototype.fail = function(str)  {
                                console.log("proto fail: " + str);
                            };
                            cb.prototype.invalid = function()  {
                                console.log("proto invalid");
                            };
                            cb.prototype.progress = function(prog)  {
                                console.log("proto progress: " + prog);
                            };
                        };
                        return cb;
                    })();

var coim_config = undefined;

var coim = {
    callback: coimCallback,
    
    coimInit: function() {
        coim_config = JSON.parse(fs.readFileSync('./config.json'));
        if(coim_config.coim_app_key === undefined || coim_config.coim_app_code === undefined) {
            console.log("(coim) please set coim_app_key or coim_app_code in config.json.");
            coim_config = undefined;
        }
        
    },
    
    getToken: function() {
        if(coim_config === undefined) {
            console.log("(coim) coim_noed is not initialized");
            return undefined;
        }
        return coim_config.token;
    },
    
    send: function(relativeURL, params, success, fail, invalid){
        if(coim_config === undefined) {
            console.log("(coim) coim_noed is not initialized");
            return;
        }
        
        var args = arguments,
        _url = args[0],
        _params = undefined,
        _success = undefined,
        _fail = undefined,
        _invalid = undefined;
        
        
        if(!(typeof _url === "string")) {
            console.log("(coim) lack of relative url string.");
            return;
        }
        
        if(typeof args[1] === "function") {
            _params = {};
            _success = args[1];
            _fail = args[2];
            _invalid = args[3];
        }
        else if (args[1] instanceof coimCallback) {
            _params = {};
            _success = args[1];
        }
        else {
            if(typeof args[1] === "object" && args[1] !== null) {
                _params = args[1];
                _success = args[2];
                _fail = args[3];
                _invalid = args[4];
            }
            else if(args[1] === null) {
                _params = {};
                _success = args[2];
                _fail = args[3];
                _invalid = args[4];
            }
            else {
                console.log("(coim plugin) params must be object.");
                return;
            }
        }
        _params._key = coim_config.coim_app_key;
        _params.token = coim_config.token;
        
        var post_data = JSON.stringify(_params);
        var options = {
            host: coim_config.coim_app_code + '.coimapi.tw',
            path: '/' + _url,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            },
            method:'post'
        };
        
        callback = function(response) {
            var data = [];
            
            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                            data.push(chunk);
                        });
            
            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                            if(response.statusCode === 200){
                                var result = JSON.parse(data.join(''));
                        
                                if(result.token !== undefined && result.token !== "") {
                                    coim_config.token = result.token;
                                    fs.writeFileSync('./config.json',JSON.stringify(coim_config,null,4));
                                }
                        
                                if (result.token !== undefined && result.token === "") {
                                    delete coim_config.token;
                                    delete coim_config.coim_accName;
                                    if(_success instanceof coimCallback)
                                        _success.invalid();
                                    else
                                        _invalid();
                                }
                        
                                if(_success instanceof coimCallback)
                                    _success.success(result);
                                else
                                    _success(result);
                            }
                            else {
                                if(_success instanceof coimCallback)
                                    _success.fail(http.STATUS_CODES[response.statusCode]);
                                else
                                    _fail(http.STATUS_CODES[response.statusCode]);
                            }
                        });
            
        }
        
        var req = http.request(options, callback);
        
        req.on('error', function (error) {
               console.log(error);
               if(_success instanceof coimCallback)
               _success.fail(error.message);
               else
               _fail(error.message);
               });
        
        req.write(post_data);
        req.end();
        
    },
        
    login: function(relativeURL, params, success, fail){
        if(coim_config === undefined) {
            console.log("(coim) coim_noed is not initialized");
            return;
        }
        
        var args = arguments,
        _url = args[0],
        _params = args[1],
        _success = undefined,
        _fail = undefined;
        
        if(!(typeof _url === "string")) {
            console.log("(coim plugin) lack of relative url string.");
            return;
        }
        
        if(_params instanceof coimCallback || typeof _params === "function") {
            console.log("(coim plugin) login requires params.");
            return;
        }
        
        if(_params['accName'] === undefined || _params['passwd'] === undefined) {
            console.log("(coim plugin) accName (and/or) passwd is required.");
            return;
        }
        
        if(typeof args[2] === "function") {
            _success = args[2];
            _fail = args[3];
        }
        else if (args[2] instanceof coimCallback) {
            _success = args[2];
        }
        
        _params['_key'] = coim_config.coim_app_key;
        
        var accName = _params['accName'];
        var passwd = _params['passwd'];
        coim_config['coim_accName'] = accName;
        var salt = sha1(accName);
        var saltPwd = sha1(salt+passwd);
        _params['passwd'] = saltPwd;
        
        var post_data = JSON.stringify(_params);
        var options = {
            host: coim_config.coim_app_code + '.coimapi.tw',
            path: '/' + _url,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            },
            method:'post'
        };
        
        callback = function(response) {
            var data = [];
            
            response.on('data', function (chunk) {
                        data.push(chunk);
                        });
            
            response.on('end', function () {
                            if(response.statusCode === 200){
                                var result = JSON.parse(data.join(''));
                                if(result.token !== undefined && result.token !== "") {
                                    coim_config.token = result.token;
                                    fs.writeFileSync('./config.json',JSON.stringify(coim_config,null,4));
                                }
                                if(_success instanceof coimCallback)
                                    _success.success(result);
                                else
                                    _success(result);
                            }
                            else {
                                if(_success instanceof coimCallback)
                                    _success.fail(http.STATUS_CODES[response.statusCode]);
                                else
                                    _fail(http.STATUS_CODES[response.statusCode]);
                            }
                        });
            
        }
        
        var req = http.request(options, callback);
        
        req.on('error', function (error) {
               console.log(error);
               if(_success instanceof coimCallback)
               _success.fail(error.message);
               else
               _fail(error.message);
               });
        
        req.write(post_data);
        req.end();
    },
        
    register: function(params, success, fail){
        var _config = JSON.parse(fs.readFileSync('./config.json'));
        if(_config.coim_app_code === undefined || _config.coim_app_key === undefined) {
            console.log("(coim) please set coim_app_key or coim_app_code in config.json.");
            return;
        }
        
        var args = arguments,
        _params = args[0],
        _success = undefined,
        _fail = undefined;
        
        if(_params instanceof coimCallback || typeof _params === "function") {
            console.log("(coim plugin) register requires params.");
            return;
        }
        
        if(_params['accName'] === undefined || _params['passwd'] === undefined || _params['passwd2'] === undefined) {
            console.log("(coim plugin) accName, passwd or passwd2 is required.");
            return;
        }
        
        if(typeof args[1] === "function") {
            _success = args[1];
            _fail = args[2];
        }
        else if (args[1] instanceof coimCallback) {
            _success = args[1];
        }
        
        _params['_key'] = coim_config.coim_app_key;
        _params['token'] = coim_config.token;
        
        var accName = _params['accName'];
        var passwd = _params['passwd'];
        var passwd2 = _params['passwd2'];
        coim_config['coim_accName'] = accName;
        
        var salt = sha1(accName);
        var saltPwd = sha1(salt+passwd);
        var saltPwd2 = sha1(salt+passwd2);
        
        _params['passwd'] = saltPwd;
        _params['passwd2'] = saltPwd2;
        
        
        var post_data = JSON.stringify(_params);
        var options = {
        host: coim_config.coim_app_code + '.coimapi.tw',
        path: '/core/user/register',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        },
        method:'post'
        };
        
        callback = function(response) {
            var data = [];
            
            response.on('data', function (chunk) {
                        data.push(chunk);
                        });
            
            response.on('end', function () {
                            if(response.statusCode === 200){
                                var result = JSON.parse(data.join(''));
                            
                                if(result.token !== undefined && result.token !== "") {
                                    console.log("save token");
                                    coim_config.token = result.token;
                                    fs.writeFileSync('./config.json',JSON.stringify(coim_config,null,4));
                                }
                            
                                if(_success instanceof coimCallback)
                                    _success.success(result);
                                else
                                    _success(result);
                            }
                            else {
                                if(_success instanceof coimCallback)
                                    _success.fail(http.STATUS_CODES[response.statusCode]);
                                else
                                    _fail(http.STATUS_CODES[response.statusCode]);
                            }
                        });
            
        }
        
        var req = http.request(options, function(response){
                               var data = [];
                               
                               //another chunk of data has been recieved, so append it to `str`
                               response.on('data', function (chunk) {
                                           data.push(chunk);
                                           });
                               response.on('end', function(){
                                            if(response.statusCode === 200){
                                                var result = JSON.parse(data.join(''));
                                           
                                                if(result.value !== undefined &&  result.value.actID !== undefined) {
                                                    var post_d = JSON.stringify({'_key': coim_config.coim_app_key});
                                                    var opt = {
                                                       host: coim_config.coim_app_code + '.coimapi.tw',
                                                       path: '/core/user/activate/'+result.value.actID,
                                                       headers: {
                                                       'Content-Type': 'application/json',
                                                       'Content-Length': post_d.length
                                                       },
                                                       method:'post'
                                                    }
                                                    var r = http.request(opt, callback);
                                                    r.on('error', function (error) {
                                                         console.log(error);
                                                         if(_success instanceof coimCallback)
                                                            _success.fail(error.message);
                                                         else
                                                            _fail(error.message);
                                                         });
                                                   
                                                    r.write(post_d);
                                                    r.end();
                                                }
                                                else {
                                                    if(_success instanceof coimCallback)
                                                        _success.success(result);
                                                    else
                                                        _success(result);
                                                }
                                            }
                                           
                                            else {
                                                   if(_success instanceof coimCallback)
                                                        _success.fail(http.STATUS_CODES[response.statusCode]);
                                                   else
                                                        _fail(http.STATUS_CODES[response.statusCode]);
                                            }
                                           });
                               });
        
        req.on('error', function (error) {
               console.log(error);
               if(_success instanceof coimCallback)
               _success.fail(error.message);
               else
               _fail(error.message);
               });
        
        req.write(post_data);
        req.end();
        
    },
        
    updPasswd: function(params, success, fail){
        var coim_config = JSON.parse(fs.readFileSync('./config.json'));
        if(coim_config.coim_app_code === undefined || coim_config.coim_app_key === undefined) {
            console.log("(coim) please set coim_app_key or coim_app_code in config.json.");
            return;
        }
        
        var args = arguments,
        _params = args[0],
        _success = undefined,
        _fail = undefined;
        
        if(_params instanceof coimCallback || typeof _params === "function") {
            console.log("(coim plugin) updPasswd requires params.");
            return;
        }
        
        if(_params['oldPasswd'] === undefined || _params['passwd'] === undefined || _params['passwd2'] === undefined) {
            console.log("(coim plugin) oldPasswd, passwd or passwd2 is required.");
            return;
        }
        
        if(typeof args[1] === "function") {
            _success = args[1];
            _fail = args[2];
        }
        else if (args[1] instanceof coimCallback) {
            _success = args[1];
        }
        
        _params['_key'] = coim_config.coim_app_key;
        _params['token'] = coim_config.token;
        
        var accName = coim_config['coim_accName'];
        var oldPasswd = _params['oldPasswd'];
        var passwd = _params['passwd'];
        var passwd2 = _params['passwd2'];
        
        coim_config['coim_accName'] = accName;
        var salt = sha1(accName);
        
        var saltOldPwd = sha1(salt + oldPasswd);
        var saltPwd = sha1(salt + passwd);
        var saltPwd2 = sha1(salt + passwd2);
        
        _params['oldPasswd'] = saltOldPwd;
        _params['passwd'] = saltPwd;
        _params['passwd2'] = saltPwd2;
        
        var post_data = JSON.stringify(_params);
        var options = {
        host: coim_config.coim_app_code + '.coimapi.tw',
        path: '/core/user/updPasswd',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        },
        method:'post'
        };
        
        callback = function(response) {
            var data = [];
            
            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                        data.push(chunk);
                        });
            
            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                        if(response.statusCode === 200){
                            var result = JSON.parse(data.join(''));
                            if(result.token !== undefined && result.token !== "") {
                                console.log("update token");
                                coim_config.token = result.token;
                                fs.writeFileSync('./config.json',JSON.stringify(coim_config,null,4));
                            }
                            if(_success instanceof coimCallback)
                                _success.success(result);
                            else
                                _success(result);
                            }
                            else {
                                if(_success instanceof coimCallback)
                                    _success.fail(http.STATUS_CODES[response.statusCode]);
                                else
                                    _fail(http.STATUS_CODES[response.statusCode]);
                            }
                        });
            
        }
        
        var req = http.request(options, callback);
        
        req.on('error', function (error) {
               console.log(error);
               if(_success instanceof coimCallback)
               _success.fail(error.message);
               else
               _fail(error.message);
               });
        
        req.write(post_data);
        req.end();
    },
        
    logout: function(success, fail){
        var coim_config = JSON.parse(fs.readFileSync('./config.json'));
        if(coim_config.coim_app_code === undefined || coim_config.coim_app_key === undefined) {
            console.log("(coim) please set coim_app_key or coim_app_code in config.json.");
            return;
        }
        
        var args = arguments,
        _params = {},
        _success = undefined,
        _fail = undefined;
        
        if(typeof args[0] === "function") {
            _success = args[0];
            _fail = args[1];
        }
        else if (args[0] instanceof coimCallback) {
            _success = args[0];
        }
        
        _params['_key'] = coim_config.coim_app_key;
        _params['token'] = coim_config.token;
        
        var post_data = JSON.stringify(_params);
        var options = {
        host: coim_config.coim_app_code + '.coimapi.tw',
        path: '/core/user/logout',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        },
        method:'post'
        };
        
        callback = function(response) {
            var data = [];
            
            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                        data.push(chunk);
                        });
            
            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                        if(response.statusCode === 200){
                        var result = JSON.parse(data.join(''));
                        if(_success instanceof coimCallback)
                        _success.success(result);
                        else
                        _success(result);
                        }
                        else {
                        if(_success instanceof coimCallback)
                        _success.fail(http.STATUS_CODES[response.statusCode]);
                        else
                        _fail(http.STATUS_CODES[response.statusCode]);
                        }
                        });
            
        }
        
        var req = http.request(options, callback);
        delete coim_config.coim_accName;
        delete coim_config.token;
        fs.writeFileSync('./config.json', JSON.stringify(coim_config, null, 4));
        req.on('error', function (error) {
               console.log(error);
               if(_success instanceof coimCallback)
               _success.fail(error.message);
               else
               _fail(error.message);
               });
        
        req.write(post_data);
        req.end();
    },
        
attach:
    function(relativeURL, params, files, success, fail, progress){
        var coim_config = JSON.parse(fs.readFileSync('./config.json'));
        if(coim_config.coim_app_code === undefined || coim_config.coim_app_key === undefined) {
            console.log("(coim) please set coim_app_key or coim_app_code in config.json.");
            return;
        }
        
        var args = arguments,
        _url = args[0],
        _params = args[1],
        _files = args[2]
        _success = args[3],
        _fail = undefined,//clone(args[4]),
        _progress = undefined;//clone(args[5]);
        
        if(!(typeof _url === "string")) {
            console.log("(coim plugin) lack of relative url string.");
            return;
        }
        
        if(_params instanceof coimCallback || (typeof _params === "function") ||
           _files instanceof coimCallback || (typeof _files === "function")) {
            console.log("(coim plugin) attach requires params and files.");
            return;
        }
        
        if(_params['nType'] === undefined) {
            console.log("(coim plugin) paramter nType is required");
            return;
        }
        
        if(_files.length === 0) {
            console.log("(coim) no file to upload");
            return;
        }
        
        var boundaryKey = new Date().getTime();
        var closeBoundry = '\r\n--' + boundaryKey + '--';
        var totalSize = 0;
        var fileFields = [];
        for (var i = 0; i < _files.length; i++) {
            if(!fs.existsSync(_files[i])) {
               console.log("(coim) file(s') does not exist.");
               return;
            }
            totalSize +=fs.statSync(_files[i]).size;
            
            var fname = _files[i].substr(_files[i].lastIndexOf("/") + 1);
            var ext = fname.substr(fname.lastIndexOf(".") + 1);
            var str = '\r\n--' + boundaryKey + '\r\n'
                    +'Content-Disposition: form-data; name="my_file'+ i +'"; filename="' + fname + '"\r\n'
                    + 'Content-Type: ' + mime.ext.getContentType(ext) + '\r\n\r\n';
            fileFields.push(str);
        }
        if(totalSize > 1000*1000) {
            console.log("(coim) file(s') size is over 1M");
            return;
        }
         
        if(typeof args[3] === "function") {
            _success = args[3];
            _fail = args[4];
            _progress = args[5];
        }
        
        else if (args[3] instanceof coimCallback) {
            _success = args[3];
        }
        
        
        var post_data = '--' + boundaryKey + '\r\n'
                        + 'Content-Disposition: form-data;name="token"\r\n\r\n'
                        + coim_config.token + '\r\n'
                        + '--' + boundaryKey + '\r\n'
                        + 'Content-Disposition: form-data;name="nType"\r\n\r\n'
                        + _params.nType;
        if(_params.title !== undefined) {
            
            post_data += '\r\n--' + boundaryKey + '\r\n'
                         + 'Content-Disposition: form-data;name="title"\r\n\r\n'
                         + _params.title;
        }
        
        var options = {
            method:'post',
            host: coim_config.coim_app_code + '.coimapi.tw',
            path: '/' + _url
        };
        
        callback = function(response) {
            var data = [];
            
            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                        data.push(chunk);
                        });
            
            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                        if(response.statusCode === 200){
                        console.log(data.join(''));
                        var result = JSON.parse(data.join(''));
                        
                        if(result.token !== undefined && result.token !== "") {
                        coim_config.token = result.token;
                        fs.writeFileSync('./config.json',JSON.stringify(coim_config,null,4));
                        }
                        
                        if (result.token !== undefined && result.token === "") {
                        if(_success instanceof coimCallback)
                        _success.invalid();
                        else
                        _invalid();
                        }
                        
                        if(_success instanceof coimCallback)
                        _success.success(result);
                        else
                        _success(result);
                        }
                        else {
                        if(_success instanceof coimCallback)
                        _success.fail(http.STATUS_CODES[response.statusCode]);
                        else
                        _fail(http.STATUS_CODES[response.statusCode]);
                        }
                        });
            
        }
        
        var req = http.request(options, callback);
        
        req.on('error', function (error) {
               console.log(error);
               if(_success instanceof coimCallback)
               _success.fail(error.message);
               else
               _fail(error.message);
               });

        req.setHeader('Connection', 'Keep-Alive');
        var length = Buffer.byteLength(post_data) + Buffer.byteLength(closeBoundry) + totalSize;
        
        for (var i=0;i<fileFields.length; i++) {
            length += Buffer.byteLength(fileFields[i])
        }
        req.setHeader('Content-Type', 'multipart/form-data; boundary="'+boundaryKey+'"');
        req.setHeader('Content-Length', length);
        req.write(post_data);
        console.log(totalSize);
        var sendData = 0;
        upload(req, 0, _files, fileFields, closeBoundry);
        
        function upload(req, index, files, fileFields, close) {
            req.write(fileFields[index]);
            
            var fileStream = fs.createReadStream(files[index], { bufferSize: 512 });
            fileStream.pipe(req, {end: false});
            fileStream.on('data', function(data) {
                          //console.log(data.length);
                          sendData += data.length;
                              if(_success instanceof coimCallback)
                                _success.progress(sendData/totalSize * 100);
                              else
                                _progress(sendData/totalSize * 100);
                          
                          });
            fileStream.on('end', function() {
                          if(index < files.length - 1) {
                          upload(req, index+1, files, fileFields, close);
                          }
                          else{
                          req.end(close);
                          }
                          });
        }
    }
}



module.exports = coim;


