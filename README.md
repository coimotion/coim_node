# coim_node
This package actually has three parts: a SDK module for node.js, a command shell (cshell) to play with the [COIMOTION](http://www.coimotion.com) API and an experimental high-level SDK which could make programming with COIMOTION extremely easy.


## Install

    npm install coim_node

## The SDK

### Setup
Before using **coim_node** in your node application, you actually have to tell **coim_node** how to communicate with COIMOTION. Here is how. First go to the **coim_node** installation directory, you can find a 'config.json' file. In the file, you should enter your client-app code as the value of the "coim_app_code" property. The app key of your client app goes to the "coim_app_key" property. Your 'config.json' file should look like:

    {
        "coim_app_code": "code_name_of_your_client_app",
        "coim_app_key": "app_key_of_the_client_app"
    }

### Use It
Once you've done the necessary setup, you can leverage the SDK to access all the COIMOTION functions in your node application. Below is how.

First of all, require the SDK and initialize it as the following:

    var  coim = require('coim');

    coim.init();

Once you've done that, you can use the coim methods to interact with the COIMOTION data store.

### Available Methods
The coim object is a singleton, and it offers the following methods:

+ **init()** : initializing the SDK

+ **attach(apiURL, params, files, success, fail, progress)** : trying to attach file(s) to a page. **apiURL** is the API path indicating the attach end point. **params** is an input parameter to specify additional information about the attached file. The possible property of the **params** object is 'title' which specifies the title of the attached file. Noted that if **params.dataURI** is given that dataURI will be used as the source of the attachment. In that case, the **files** parameters will be ingored. If **params.dataURI** is not given, the **files** parameter will be treated as an Javascript array with each element pointing to the source of the attached file. For example, ['/user/john/files/foo.png']. Since the **files** parameter is an array, the **attach()** method is capable of uploading multiple files at a time. In fact, you can upload up the three files at a time.

+ **getToken()**: returning the access token of the current user.

+ **login(apiURL, params, success, fail)** : sending a login request.  **apiURL** is the API path indicating the login end point (which is 'core/user/login' for most cases). **params** is a parameter object with two properties: accName and passwd. **success(result)** is a callback function which will be invoked when the login request is successfully processed, otherwise the **fail(err)** callback function will be called.

+ **logout(success, fail)** : logging out an user. **success(result)** is a callback function which will be invoked when the request is successfully processed, otherwise the **fail(err)** callback function will be called.

+ **register(params, success, fail)**: allowing an user to register him/herself with your app. The **params** parameter should at least containing three properties: accName, passwd and passwd2. It can contain more properties about an user. For more details about what information will be saved for an user, please refer to the 'core/user/register' API document (available on the COIMOTION website). **success(result)** is a callback function which will be invoked when the register request is successfully processed, otherwise the **fail(err)** callback function will be called.

+ **send(apiURL, params, success, fail, invalid)**: sending out an API request to the COIMOTION server. **apiURL** is the API path which should look like 'repo/rs/op/[id]'. **params** is the input parameters associated with the request. The last three parameters (success, fail, invalid) are all callback functions. They will be invoked when the request is success, failed or complained with invalid token respectively. The success(result) callback will be invoked with a result object representing the execution result. The fail(err) callback will be called with an error object while the invalid() method will be called without parameters.

+ **updPasswd(params, success, fail)**: changing an user's password. The **params** parameter should contain the following properties: oldPasswd, passwd and passwd2. **success(result)** is a callback function which will be invoked when the request is successfully processed, otherwise the **fail(err)** callback function will be called.

Above are the base-line support available from the SDK. In additional to those, the coim_node package also offers a high-level API named **Remote Entity API (REA)**. The following methods are related to REA and further descriptions about REA can be found in the later secitons.

+ **getRepo(WEB_REPO_CODE)** : This function will have REA to connect to the COIMOTION service and return the corresponding Repo object. What is a Repo object will be explained later.

+ **releaseRepo(repo)** : Release a repository. Once it's done, the 'repo' object can no longer be used.

## CShell
'CShell' is a command line tool created to help developers play with the COIMOTION API. Some people may wonder, why not just use 3rd party client tools such as Postman or DHC? The reason is that in COIMOTION any password has to be hashed and salted before sent to the API engine and client side tools such as Postman or DHC could not help with that (you'll have to hash&salt manually). Also the COIMOTION API engine may dynamically change tokens in a session, and Postman or DHC have no help in that regard, either. To make developer's life easier we build this tool.

### Usage

Assuming you have set up the 'config.json' file as in the **SDK.Setup** section above, you can kick off the tool:

    > cd coim_node
    > node cshell

You should see the 'coim' prompt:

    coim >

Now you can enter commands just like you do with a Linux shell or Windows console.

### Commands
At the current version, **cshell** offers four commands to play.

#### login
If this is the first time you use coim_node, you should do login first. Just type 'login' in the command line, coim_node will ask for your account name and password and try to do login for you. If login is successful, coim_node will save your token in 'config.json' and you don't have to do login again (even if you have exited the program) unless you do logout.

    > coim > login
    Account Name: [your_username]
    Password: [your_password]

#### logout
Simply type 'logout' in the command line, and coim_node will log you out and descroy the token.

#### send
Most of the time, 'send' is the only command you need. When you type 'send' (and hit enter), coim_node will ask what API request along with the parameters needed to be sent over to the COIMOTION API engine. API takes the format as: "wa/rs/op/[id]", and parameters should be wrapped as a JSON object. If your API request does not need any parameters, simply enter 'return'.

    coim > send
    API: core/user/profile
    params:

    [send]: results received as below:
    {
      "errCode": 0,
      "message": "Ok",
      "value": {
          "dspName": "[your_username]",
          "isGuest": false
      }
    }

#### exit
This command will exit the program.


## Remote Entities
------------------

Starting from release 0.1, we're experimenting with a high-level API called **Remote Entity API (REA)** which allows developers to access data stored in COIMOTION as entities. What this high-level API offers is that you don't have to send out API requests (which sometimes may not be very developer friendly) to load or update data anymore. Instead, you can treat every resource of a repository like a class and load resource data as instances (entities) of that class.

Assuming you have a web reposiroty called 'BookStore' and that repository has a resource named 'book' which inherits its functions from the 'cms/page' resource, then you can play with the 'BookStore' repository with the following commands (using **cshell** ):

    1  > node cshell
    2
    3  coim > f = coim.getRepo('BookStore');
    4  coim > myRepo = f.result;
    5  coim > f = myRepo.findEntity('book', 108);
    6  coim > book = f.result;
    7  coim > console.log( JSON.stringify(book) );
    8  coim > book.title = 'A New Title';
    9  coim > book.save();

Line 1 starts the cshell tool. Line 3 gets a 'future' which is returned from the Repo.getRepo() function. A **future** is something similar to a 'promise'.  It can be returned from an asynchronous function call and its 'result' property will be filled with the execution result if the function is successfully executed. With that, assuming everything is fine and we can obtain the 'BookStore' repository in line 4.

On line 5, we use the repository to find a book entity whose id # is 108. On line 6, we receive the book entity. We try to change its title on line 8 and make the change persistent on the COIMOTION data store on line 9 by calling the save() method.

You can try it yourself using **cshell**. It should work just like that (assuming you've set up a repository on COIMOTION and use the correct repositoy name and the resource name).

### The Remote Entity APIs (REA)
Basically there are two type of objects defined by the **remote entity API**: 'Repo' and 'Entity'.

The **Repo** object is the client side representation of a web repository on the COIMOTION data store, and the **Entity** object is the client side representation of a resource belonging to a web repository.

#### The Repo Object
For each **Repo** instance, there are useful methods as below:

+ **createEnty(name, data, callback)** : This method will create a new entity and persist it to the COIMOTION data store. The **name** parameter is the resource name of the entity and the **data** parameter contains the initial data of the entity. The callback function should take two parameters: error and entity. The 'error' parameter is not null if anything wrong happens. Otherwise, an entity object will be returned as the second parameter.

+ **deleteEnty(enty, callback)** : This method will persistently delete an entity (both on the client and remote side). The callback function will have a 'err' parameter to indicate if errors occurred.

+ **findEnty(name, id, callback)** : This method can be used to look for an entity (with the given resource name and id). If such an entity can be found on the remote (COIMOTION) side, a local copy of that entity will be created. The callback function should take two parameters: error and entity. The 'error' parameter is not null if anything wrong happens. Otherwise, the found entity object will be returned as the second parameter.

+ **saveEnty(enty, callback)** : This method will save any updates of an entity back to the remote side.

+ **listEnties(name, params, callback)** : This method will return an array of objects (entities) with conditions set by the **param** parameter. Noted that the elements in the returned array are plain Javascript objects instead of REA entities.

+ **api(apiPath, params, callback)** : This is a simplified version of the coim.send() method.

#### The Entity Object
The **Entity** object offers the following methods:

+ **getId()** : returns the identifier of an entity.

+ **del()** : deletes an entity permanently.

+ **save(callback)** : saves the entity to the remote side (update will be permanent). The callback will be invoked when the save operation is done.

#### The Page Entity Object
REA will endow entities will additional capabilities if REA can recognize an entity as a special type. For example, if an entity is of a resource which inherits the 'cms/page resource, then REA will recognize such an entity as a 'page entity' and a few more methods will be added to the entity:

+ **attach(params, files, callback)** : attaches files to this entity. It actually delegate the job to the repo.attach() method.

+ **detach(cnID, callback)** : detach a file from the entity. The **cnID** is the id returned from the attach() function call.

+ **listAux(nType, callback)** : list the attachments of the page entity. Please refer to the COIMOTION API documentation on cms/page/listAux for what this method means.

+ **tag(tagWords, callback)** : tag the page entity. Tags should be put in an array (**tagWords**) even if there is just one tag.

+ **untag(tagWords, callback)** : remove tags from an page entity. Similar to the **tag()** method, tags should be put in an array.

+ **addGeo(geData, callback)** : add a geo-location to a page entity.

+ **findGeo(id, callback)** : find if a geo-location with the specified id is available.

+ **listGeo(params, callback)** : return a list of all geo-locations related (attached) to the page.

#### The Geo Entity Object
For entities of a resource inheriting the 'cms/geoLoc' resource, REA will recognize such entities as 'geo entity' and additional methods will be added to those entities:

+ **createPage(pgData, callback)** : create an associated page of the geo-location. The **pgData** contains the initial data of such a page.

+ **findPage(id, callback)** : find out if the geo-location has an associated page of the specified id.

+ **listPages(params, callback)** : return a list of all pages associated with the geo-location. The **params** parameter can be used to specify the filter conditions.

+ **tag(tagWords, callback)** : tag the geo entity. Tags should be put in an array (**tagWords**) even if there is just one tag.

+ **untag(tagWords, callback)** : remove tags from an geo entity. Similar to the **tag()** method, tags should be put in an array.

#### The Promise
Besides callback, both the Repo and Entity objects support the 'promise' coding style. Actually, both Repo and Entity are promisified via the bluebird.js module right after they're created. The following sample code demonstrates how promise can be used:

    var  assert = require('assert'),
         coim = require('./lib/coim');

    coim.init();

    var  params = {accName: 'foo@xxx', passwd: 'zzzz'};
    coim.login('core/user/login', params, function(result) {
        if (result.errCode === 0)  {
            coim.getRepo('ben_lue', function(err, myRepo) {
                if (err)
                    console.log('Error as: %s', JSON.stringify(err));
                else
                    testRepoFind(myRepo);
            });
        }
        else
            console.log('Login result: [%d] %s', result.errCode, result.message);
    },
    function(err) {
        console.log('Oops! Failed to login.')
    });

    function  testRepoFind(myRepo)  {
        var  ngID = 35026;

        // using promise...
        myRepo.findEntyAsync('myPage', ngID).then( function(page) {
            assert.strictEqual( page.ngID, ngID, 'ngID is not correct.');
        }).catch( function(err) {dumpError('testRepoFind', err)} );
    };
