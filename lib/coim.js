/*!
 * coServ
 * authors: Hungyu Su
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var sha1 = require("./sha1.js"),
    fs = require("fs"),
    http = require("http"),
    https = require("https"),
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

var dLog = function(msg) {
    if(coim_config && (coim_config.debug || coim_config.coim_debug)) {
        console.log("[DEBUG] - " + msg);
    }
}

var coim_config = undefined;

var coim = {
    callback: coimCallback,

    init: function() {
        coim_config = JSON.parse(fs.readFileSync('./config.json'));
        if(coim_config.coim_app_key === undefined || coim_config.coim_app_code === undefined) {
            coim_config = undefined;
            dLog("(coim) please set coim_app_key or coim_app_code in config.json.");
            throw "(coim) please set coim_app_key or coim_app_code in config.json."
        }
    },

    getToken: function() {
        if(coim_config === undefined) {
            dLog("(coim) coim_node is not initialized");
            throw "(coim) coim_node is not initialized";
        }
        return coim_config.token;
    },

    send: function(relativeURL, params, success, fail, invalid){
        if(coim_config === undefined) {
            dLog("(coim) coim_node is not initialized");
            throw "(coim) coim_node is not initialized";
        }

        var args = arguments,
        _url = args[0],
        _params = undefined,
        _success = undefined,
        _fail = undefined,
        _invalid = undefined;


        if(!(typeof _url === "string")) {
            dLog("(coim) url required.");
            throw "(coim) url required.";
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
            else {//if(args[1] === null) {
                _params = {};
                _success = args[2];
                _fail = args[3];
                _invalid = args[4];
            }/*
            else {
                console.log("(coim plugin) params must be object.");
                return;
            }*/
        }
        for(var key in _params) {
            if(typeof _params[key] !== "string")
                _params[key] = JSON.stringify(_params[key]);
        }

        _params._key = coim_config.coim_app_key;
        if(!_params.token)
            _params.token = coim_config.token;

        var post_data = (JSON.stringify(_params));
        var options = {
            host: coim_config.coim_app_code + getApiHost(),
            path: '/' + _url,
            headers: {
                'Content-Type': 'application/json;charset=utf8',
                'Content-Length': Buffer(post_data).length
            },
            method:'post'
        };

        dLog("host: " + options.host);
        dLog("path: " + options.path);
        dLog("parameters: \n" + post_data);

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
            dLog("(coim) coim_node is not initialized");
            throw "(coim) coim_node is not initialized";
        }

        var args = arguments,
        _url = args[0],
        _params = args[1],
        _success = undefined,
        _fail = undefined;

        if(!(typeof _url === "string")) {
            dLog("(coim) lack of relative url string.");
            throw "(coim) lack of relative url string.";
        }

        if(_params instanceof coimCallback || typeof _params === "function") {
            dLog("(coim) login requires params.");
            throw "(coim) login requires params.";
        }

        if(_params['accName'] === undefined || _params['passwd'] === undefined) {
            dLog("(coim) accName (and/or) passwd is required.");
            throw "(coim) accName (and/or) passwd is required.";
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
            host: coim_config.coim_app_code + getApiHost(),
            path: '/' + _url,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer(post_data).length
            },
            method:'post',
            //ignore invalid certificate in SSL
            rejectUnauthorized: false,
            requestCert: true,
            agent: false
        };

        dLog("host: " + options.host);
        dLog("path: " + options.path);
        dLog("parameters: \n" + post_data);

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

        var req;
        if(coim_config.ssl !== undefined && !coim_config.ssl) {
            dLog("login without SSL")
            req = http.request(options, callback);
        }
        else {
            req = https.request(options, callback);
            dLog("login with SSL");
        }

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
        if(coim_config === undefined) {
            dLog("(coim) coim_node is not initialized");
            throw "(coim) coim_node is not initialized";
        }

        var args = arguments,
        _params = args[0],
        _success = undefined,
        _fail = undefined;

        if(_params instanceof coimCallback || typeof _params === "function") {
            dLog("(coim) register requires params.");
            throw "(coim) register requires params.";
        }

        if(_params['accName'] === undefined || _params['passwd'] === undefined || _params['passwd2'] === undefined) {
            dLog("(coim) accName, passwd or passwd2 is required.");
            throw "(coim) accName, passwd or passwd2 is required.";
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
            host: coim_config.coim_app_code + getApiHost(),
            path: '/core/user/register',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer(post_data).length
            },
            method:'post',
            //ignore invalid certificate in SSL
            rejectUnauthorized: false,
            requestCert: true,
            agent: false
        };
        dLog("host: " + options.host);
        dLog("path: " + options.path);
        dLog("parameters: \n" + post_data);
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
        var req;
        if(coim_config.ssl !== undefined && !coim_config.ssl) {
            dLog("registe without SSL");
            req = https.request(options, function(response){
                                   var data = [];

                                   response.on('data', function (chunk) {
                                               data.push(chunk);
                                               });
                                   response.on('end', function(){
                                                if(response.statusCode === 200){
                                                    dLog("registered");
                                                    var result = JSON.parse(data.join(''));

                                                    if(result.value !== undefined &&  result.value.actID !== undefined) {
                                                        /*var post_d = JSON.stringify({'_key': coim_config.coim_app_key});
                                                        var opt = {
                                                           host: coim_config.coim_app_code + getApiHost(),
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
                                                        r.end();*/
                                                        if(_success instanceof coimCallback)
                                                            coim.send('core/user/activate/'+result.value.actID, {}, _success);
                                                        else
                                                            coim.send('core/user/activate/'+result.value.actID, {}, _success, _fail, _invalid);
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
        }
        else {
            dLog("registe with SSL");
            req = http.request(options, function(response){
                                    var data = [];

                                    response.on('data', function (chunk) {
                                                data.push(chunk);
                                                });
                                    response.on('end', function(){
                                                if(response.statusCode === 200){
                                                    var result = JSON.parse(data.join(''));

                                                    if(result.value !== undefined &&  result.value.actID !== undefined) {
                                                        /*var post_d = JSON.stringify({'_key': coim_config.coim_app_key});
                                                         var opt = {
                                                         host: coim_config.coim_app_code + getApiHost(),
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
                                                         r.end();*/
                                                        if(_success instanceof coimCallback)
                                                            coim.send('core/user/activate/'+result.value.actID, {}, _success);
                                                        else
                                                            coim.send('core/user/activate/'+result.value.actID, {}, _success, _fail, _invalid);

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
        }


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
        if(coim_config === undefined) {
            dLog("(coim) coim_node is not initialized");
            throw "(coim) coim_node is not initialized";
        }

        var args = arguments,
        _params = args[0],
        _success = undefined,
        _fail = undefined;

        if(_params instanceof coimCallback || typeof _params === "function") {
            dLog("(coim) updPasswd requires params.");
            throw "(coim) updPasswd requires params.";
        }

        if(_params['oldPasswd'] === undefined || _params['passwd'] === undefined || _params['passwd2'] === undefined) {
            dLog("(coim) oldPasswd, passwd or passwd2 is required.");
            throw "(coim) oldPasswd, passwd or passwd2 is required.";
        }

        if(typeof args[1] === "function") {
            _success = args[1];
            _fail = args[2];
        }
        else if (args[1] instanceof coimCallback) {
            _success = args[1];
        }

        _params['_key'] = coim_config.coim_app_key;
        if(!_params['token'])
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
            host: coim_config.coim_app_code + getApiHost(),
            path: '/core/user/updPasswd',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer(post_data).length
            },
            method:'post',
            //ignore invalid certificate in SSL
            rejectUnauthorized: false,
            requestCert: true,
            agent: false
        };
        dLog("host: " + options.host);
        dLog("path: " + options.path);
        dLog("parameters: \n" + post_data);
        callback = function(response) {
            var data = [];

            response.on('data', function (chunk) {
                        data.push(chunk);
                        });

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

        var req;
        if(coim_config.ssl !== undefined && !coim_config.ssl) {
            dLog("updPasswd without SSL");
            req = http.request(options, callback);
        }
        else {
            dLog("updPasswd with SSL");
            req = https.request(options, callback);
        }

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
        if(coim_config === undefined) {
            dLog("(coim) coim_node is not initialized");
            throw "(coim) coim_node is not initialized";
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
        if (!_params['token'])
            _params['token'] = coim_config.token;

        var post_data = JSON.stringify(_params);
        var options = {
            host: coim_config.coim_app_code + getApiHost(),
            path: '/core/user/logout',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer(post_data).length
            },
            method:'post'
        };
        dLog("host: " + options.host);
        dLog("path: " + options.path);
        dLog("parameters: \n" + post_data);
        callback = function(response) {
            var data = [];

            response.on('data', function (chunk) {
                        data.push(chunk);
                        });

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
        if(coim_config === undefined) {
            dLog("(coim) coim_node is not initialized");
            throw "(coim) coim_node is not initialized";
        }

        var args = arguments,
        _url = args[0],
        _params = args[1],
        _files = args[2]
        _success = undefined,
        _fail = undefined,
        _progress = undefined;

        if(!(typeof _url === "string")) {
            dLog("(coim) lack of relative url string.");
            throw "(coim) lack of relative url string.";
        }

        if(_params instanceof coimCallback || (typeof _params === "function") ||
           _files instanceof coimCallback || (typeof _files === "function")) {
            dLog("(coim) attach requires params and files.");
            throw "(coim) attach requires params and files.";
        }

        if(_params['nType'] === undefined) {
            dLog("(coim) paramter nType is required");
            throw "(coim) paramter nType is required";
        }

        if(_files.length === 0) {
            if(_params['dataURI']) {
                coim.send(relativeURL, _params, success, fail, progress);
                return;
            }
            else {
                dLog("(coim) no file to upload");
                throw "(coim) no file to upload";
            }
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
            dLog("(coim) file(s') size is over 1M");
            throw "(coim) file(s') size is over 1M";
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
                        + 'Content-Disposition: form-data;name="nType"\r\n\r\n'
                        + _params.nType;
        if (_params.token){
            post_data += '\r\n--' + boundaryKey + '\r\n'
                         + 'Content-Disposition: form-data;name="token"\r\n\r\n'
                         + _params.token;
        }
        else {
            post_data += '\r\n--' + boundaryKey + '\r\n'
                         + 'Content-Disposition: form-data;name="token"\r\n\r\n'
                         + coim_config.token;
        }

        if(_params.title !== undefined) {

            post_data += '\r\n--' + boundaryKey + '\r\n'
                         + 'Content-Disposition: form-data;name="title"\r\n\r\n'
                         + _params.title;
        }
        var options = {
            method:'post',
            host: coim_config.coim_app_code + getApiHost(),
            path: '/' + _url
        };
        dLog("host: " + options.host);
        dLog("path: " + options.path);
        dLog("parameters: \n" + JSON.stringify(_params));
        callback = function(response) {
            var data = [];

            response.on('data', function (chunk) {
                        data.push(chunk);
                        });

            response.on('end', function () {
                        if(response.statusCode === 200){
                        //console.log(data.join(''));
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
                          sendData += data.length;
                              if(_success instanceof coimCallback)
                                _success.progress(sendData/totalSize * 100);
                              else
                                if(_progress !== undefined)
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

function  getApiHost()  {
    return  '.coimapi.tw';
    //return  '.skinapi.com';
}

module.exports = coim;
