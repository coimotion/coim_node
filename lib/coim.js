var sha1 = require("./sha1.js"),
    fs = require("fs"),
    http = require("http"),
    formData = require("form-data");
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

var coim = {
    callback: coimCallback,
    
    getToken: function() {
        var _config = JSON.parse(fs.readFileSync('./config.json'));
        return _config.token;
    },
    
    send: function(relativeURL, params, success, fail, invalid){
        var _config = JSON.parse(fs.readFileSync('./config.json'));
        console.log(_config);
        if(_config.coim_app_key === undefined || _config.coim_app_code === undefined) {
            console.log("(coim) please set coim_app_key or coim_app_code in config.json.");
            return;
        }
        
        var args = arguments,
        _url = args[0],
        _params = undefined,
        _success = undefined,
        _fail = undefined,
        _invalid = undefined;
        
        
        if(!(typeof _url === "string")) {
            console.log("(coim plugin) lack of relative url string.");
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
        _params._key = _config.coim_app_key;
        _params.token = _config.token;
        
        var post_data = JSON.stringify(_params);
        var options = {
            host: _config.coim_app_code + '.coimapi.tw',
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
                                    _config.token = result.token;
                                    fs.writeFileSync('./config.json',JSON.stringify(_config,null,4));
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
        
        req.write(post_data);
        req.end();
        
    },
        
    login: function(relativeURL, params, success, fail){
        var _config = JSON.parse(fs.readFileSync('./config.json'));
        if(_config.coim_app_code === undefined || _config.coim_app_key === undefined) {
            console.log("(coim) please set coim_app_key or coim_app_code in config.json.");
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
        
        _params['_key'] = _config.coim_app_key;
        
        var accName = _params['accName'];
        var passwd = _params['passwd'];
        _config['coim_accName'] = accName;
        fs.writeFileSync('./config.json', JSON.stringify(_config, null, 4));
        var salt = sha1(accName);
        var saltPwd = sha1(salt+passwd);
        _params['passwd'] = saltPwd;
        
        var post_data = JSON.stringify(_params);
        var options = {
            host: _config.coim_app_code + '.coimapi.tw',
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
                                    _config.token = result.token;
                                    fs.writeFileSync('./config.json',JSON.stringify(_config,null,4));
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
        
        _params['_key'] = _config.coim_app_key;
        _params['token'] = _config.token;
        
        var accName = _params['accName'];
        var passwd = _params['passwd'];
        var passwd2 = _params['passwd2'];
        _config['coim_accName'] = accName;
        fs.writeFileSync('./config.json', JSON.stringify(_config, null, 4));
        
        var salt = sha1(accName);
        var saltPwd = sha1(salt+passwd);
        var saltPwd2 = sha1(salt+passwd2);
        
        _params['passwd'] = saltPwd;
        _params['passwd2'] = saltPwd2;
        
        
        var post_data = JSON.stringify(_params);
        var options = {
        host: _config.coim_app_code + '.coimapi.tw',
        path: '/core/user/register',
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
                                    console.log("save token");
                                    _config.token = result.token;
                                    fs.writeFileSync('./config.json',JSON.stringify(_config,null,4));
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
                                                    var post_d = JSON.stringify({'_key': _config.coim_app_key});
                                                    var opt = {
                                                       host: _config.coim_app_code + '.coimapi.tw',
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
        
        _params['_key'] = _config.coim_app_key;
        _params['token'] = _config.token;
        
        var accName = _config['coim_accName'];
        var oldPasswd = _params['oldPasswd'];
        var passwd = _params['passwd'];
        var passwd2 = _params['passwd2'];
        
        _config['coim_accName'] = accName;
        var salt = sha1(accName);
        
        var saltOldPwd = sha1(salt + oldPasswd);
        var saltPwd = sha1(salt + passwd);
        var saltPwd2 = sha1(salt + passwd2);
        
        _params['oldPasswd'] = saltOldPwd;
        _params['passwd'] = saltPwd;
        _params['passwd2'] = saltPwd2;
        
        var post_data = JSON.stringify(_params);
        var options = {
        host: _config.coim_app_code + '.coimapi.tw',
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
                                _config.token = result.token;
                                fs.writeFileSync('./config.json',JSON.stringify(_config,null,4));
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
        var _config = JSON.parse(fs.readFileSync('./config.json'));
        if(_config.coim_app_code === undefined || _config.coim_app_key === undefined) {
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
        
        _params['_key'] = _config.coim_app_key;
        _params['token'] = _config.token;
        
        var post_data = JSON.stringify(_params);
        var options = {
        host: _config.coim_app_code + '.coimapi.tw',
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
        delete _config.coim_accName;
        delete _config.token;
        fs.writeFileSync('./config.json', JSON.stringify(_config, null, 4));
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
        
    attach: function(relativeURL, params, files, success, fail, progress){
        var _config = JSON.parse(fs.readFileSync('./config.json'));
        if(_config.coim_app_code === undefined || _config.coim_app_key === undefined) {
            console.log("(coim) please set coim_app_key or coim_app_code in config.json.");
            return;
        }
        
        var args = arguments,
        _url = args[0],
        _params = args[1],
        _files = args[2]
        _success = undefined,
        _fail = undefined,
        _progress = undefined;
        
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
            console.log("(coim plugin) no file to upload");
            return;
        }
        var totalSize = 0;
        for (var i = 0; i < _files.length; i++) {
            if(!fs.existsSync(_files[i])) {
               console.log("(coim plugin) file(s') does not exist.");
               return;
            }
            totalSize +=fs.statSync(_files[i]).size;
            //console.log();
        }
        if(totalSize > 1000*1000) {
            console.log("(coim plugin) file(s') size is over 1M");
            return;
        }
         
        if(typeof args[3] === "function") {
            _success = args[3];
            _fail = args[4];
            _invalid = args[5];
        }
        
        else if (args[3] instanceof coimCallback) {
            _success = args[3];
        }
        
        var boundaryKey = new Date().getTime();
        var post_data = '--' + boundaryKey + '\r\n'
                        + 'Content-Disposition: form-data;name="token"\r\n\r\n'
                        + _config.token + '\r\n'
                        + '--' + boundaryKey + '\r\n'
                        + 'Content-Disposition: form-data;name="nType"\r\n\r\n'
                        + _params.nType + '\r\n';
        if(_params.title !== undefined) {
            
            post_data += '--' + boundaryKey + '\r\n'
                         + 'Content-Disposition: form-data;name="title"\r\n\r\n'
                         + _params.title + '\r\n';
        }
        
        var options = {
            method:'post',
            host: _config.coim_app_code + '.coimapi.tw',
            path: '/' + _url,
            /*headers: {
                'Content-Type': 'multipart/form-data; boundary="'+boundaryKey+'"',
                'Content-Length': totalSize
            }*/
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
                        _config.token = result.token;
                        fs.writeFileSync('./config.json',JSON.stringify(_config,null,4));
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

        
        //req.setHeader('Connection', 'Keep-Alive');
        req.setHeader('Content-Type', 'multipart/form-data; boundary="'+boundaryKey+'"');
        // the header for the one and only part (need to use CRLF here)
        req.write(post_data);
        //req.end();
        
        for(var i = 0; i<_files.length; i++ ) {
            req.write('--' + boundaryKey + '\r\n'
            +'Content-Disposition: form-data; name="my_file"; filename="my.png"\r\n'
            + 'Content-Type: image/png\r\n\r\n');
            
            //post_data += fs.readFileSync(_files[i]).toString("base64");
            fs.createReadStream(_files[i], { bufferSize: 4 * 1024 })
            .pipe(req); // maybe write directly to the socket here?
            req.write('\r\n');
        }
        req.write('--' + boundaryKey + '--');
        req.end();
        //form.pipe(req);
        //console.log("L: " + form.knownLength );
        //form.submit("http://" + _config.coim_app_code + ".coimapi.tw/workshop/beef/attach/31549",function(err, res) {
        //            console.log(err);
        //            console.log(res.statusCode);
        //            });
    }
}

module.exports = coim;


