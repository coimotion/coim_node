/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
 var readline = require('readline'),
     coim = require('./lib/coim');

coim.init();

var  stdin = process.stdin,
     stdout = process.stdout;

var  rl = readline.createInterface({
    input: stdin,
    output: stdout
});

rl.setPrompt('coim > ', 7);
rl.prompt();


rl.on('line', commander).on('close', function() {
    doExit();
});


function commander(cmd) {
    cmd = cmd.trim();

    switch (cmd)  {
    case  'login':
        doLogin();
        break;
    case  'logout':
        doLogout();
        break;
    case  'send':
        doSend();
        break;
    case  'exit':
        doExit();
        break;
    default:
        if (cmd)
            console.log('Unknown command.');
        rl.prompt();
    }
};


function  doLogin()  {
    rl.question('Account Name: ', function(accName) {
        rl.removeListener('line', commander);
        stdout.write('Password: ');

        var  worker = new pwWorker();
        worker.callback = function callback(passwd) {
            stdin.removeListener('data', worker.listenChar);
            //console.log('accName: %s, passwd: %s', accName, passwd);

            coim.login('core/user/login', {accName: accName, passwd: passwd}, function(result) {
                console.log('[login]: %s\n', result.message );
                rl.on('line', commander);
                rl.prompt();
            });
        };

        stdin.on('data', worker.listenChar);
    });
};


function  doLogout()  {
    coim.logout(function(result) {
        console.log('[logout]: %s\n', result.message );
        rl.prompt();
    });
};


function  doSend() {
    rl.question('API: ', function(apiPath) {

        var  jstr = '';
        var  listenC = function(params) {
            params = params.trim();
            jstr += params;

            if (params && params.charAt(params.length-1) === '}')  {
                try  {
                    params = JSON.parse(jstr);
                    apiSend( apiPath, params );
                }
                catch (e)  {
                    console.log('[send]: parameters should be a valid JSON object.\n');
                    rl.prompt();
                }
            }
            else
                rl.question('    ', listenC);
        };

        rl.question('params: ', function(params) {
            params = params.trim();

            if (params)  {
                jstr = params;
                rl.question('    ', listenC);
            }
            else
                apiSend( apiPath, null );
        });
    });
};


function  apiSend(apiPath, params)  {
    coim.send(apiPath, params, function(result) {
        console.log('[send]: results received as below:\n%s\n', JSON.stringify(result, null, 4));
        rl.prompt();
    });
}


function  doExit()  {
    console.log('\nBye-bye!');
    process.exit(0);
};


var  pwWorker = (function() {

    var  worker = function() {
        var  password = '',
             display = '',
             worker = this;

        this.listenChar = function(c)  {
            c = c + '';

            switch (c)  {
            case "\n":
            case "\r":
            case "\u0004":
                worker.callback( password );
                break;
            default:
                readline.moveCursor(process.stdin, -1, 0);
                readline.clearLine(process.stdin, 1);
                stdout.write('*');
                if (c.charCodeAt(0) === 127)
                    password = password.substring(0, password.length - 1);
                else
                    password += c;

                break;
            }
        };
    };

    worker.prototype.callback = function(passwd) {};

    return  worker;
})();
