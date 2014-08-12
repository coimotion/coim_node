# coim_node
這個模組套件包含了三個部分：一個 node.js 的 SDK, 一個用來與 [COIMOTION](http://tw.coimotion.com) API 互動的執行列工具 (command line tool), 以及一個高階的、讓遠端服務的操作更便捷的 SDK。

## 安裝
    npm install coim_node

## The SDK
### 設定
在使用 **coim_node** 這個 SDK 之前，你必須先告訴 ** coim_node** 如何與 COIMOTION 對談。首先要設定 'config.json' 這個設定檔。這個檔案可以在安裝目錄下找到。你必須把子端程式代碼和子端程式金鑰設定到這個檔案中。設定完成後，檔案會像這個樣子：

    {
        "coim_app_code": "code_name_of_your_client_app",
        "coim_app_key": "app_key_of_the_client_app"
    }

一旦完成設定，你就可以開始使用這個工具了。

### 如何使用
完成設定後，你可以用以下的 sample code 來載入和起始化 SDK:

    var  coim = require('coim');
    
    coim.init();
    
接著你就可以在程式中，執行任何與 COIMOTION 相關的程式。

### SDK 的功能（函式）
當你執行 require 所獲得的 coim 物件，提供了以下的功能：

+ **init()** : 將 coim 起始化

+ **attach(apiURL, params, files, success, fail, progress)** : 將附件檔夾帶到一個網頁上。 **apiURL** 是提供赴建檔上傳的 API 服務路徑，**params** 則是額外的參數。例如 **params.title** 可用來標示上傳檔的標題。此外，如果你提供了 **params.dataURI** 這個屬性，這表示所給定的 dataURI 將被用做為赴建檔的來源，此時 **files** 參數將被忽略。如果 **params.dataURI** 屬性沒給，那麼 **files** 參數就提供了上傳檔的路徑。**files** 參數必須以 Javascript 陣列的形式提供，例如 ['/user/john/files/foo.png']。利用這個函式，一次最多可同時傳送三個檔案。

+ **getToken()** : 傳回使用者目前的 access token。

+ **login(apiURL, params, success, fail)** : 送出登入的要求。**apiURL** 是登入的服務網址，通常為 'core/user/login'。**params** 參數中應該有二個屬性，分別為 accName 和 passwd。**success(result)** 在登入作業成功時會被呼叫，而發生錯誤時則呼叫 **fail(err)**。

+ **logout(success, fail)** : 將使用者登出。執行成功後會呼叫 **success(result)**，否則呼叫 **fail(err)**。

+ **register(params, success, fail)** : 註冊會員。**params** 參數中應該至少包含三個屬性：accName 、 passwd 和 passwd2。**params** 參數中可以提供更多使用者的資訊，細節請詳見 'core/user/register' 這個 API 的文件。

+ **send(apiURL, params, success, fail, invalid)** : 送出 API 的要求。**apiURL** 是所要執行的 API 網址，必須是類似 'repo/rs/op/[id]' 的格式。**params** 則是執行 API 服務時所需要的額外參數。API 執行成功時會呼叫 **sucess(result)**，呼叫失敗則引用 **fail(err)**。如果所使用的 token 已失效，則會呼叫 **invalid()**。如果 **invalid()** 被叫用，開發者應試圖將使用者登出，並要求重新登入。

+ **updPasswd(params, success, fail)** : 變更使用者密碼。**params** 參數必須包含三個屬性：oldPasswd, passwd 和 passwd2。

以上為 **coim_node** 所提供的基本功能。除此之外，**coim_node** 還提供了高階的介面，稱之為  **Remote Entity API (REA)**。關於 REA 下面的章節會有更多的介紹。目前先說明 **coim_node** 中所提供二個與 REA 相關的函式：

+ **getRepo(WEB_REPO_CODE)** : 取得代碼為 'WEB_REPO_CODE' 的內容集（Repo 物件）。關於 Repo 物件，後面有更多的介紹。

+ **releaseRepo(repo)** : 釋放並清除 Repo 物件。Repo 物件一旦被釋放就不能再使用。

## CShell
'CShell' 是用來幫助開發者測試或控制 COIMOION API 服務的一個執行列工具。你也許會疑問為什麼不使用類似 Postman 或 DHC 等子端工具就好？主要原因是 COIMOTION 要求所有的密碼在傳輸前都必須先做過 hash & salt 的動作。如果沒有工具的幫忙，每次要手動執行 hash & salt 是很麻煩的事。此外，COIMOTION API 引擎為了提供最安全的服務，會視狀況隨時更新 token。為了免除開發者手動處理這些作業的麻煩，我們建造了 cshell 這個工具。

### 如何使用
假設你已一直前的說明設定好 config.json 檔，那麼依以下的命令就能叫用 cshell:

    > cd coim_node
    > node cshell

執行成功，你應該會看到 'coim' 的提示字：

    > coim

這個命令列工具就像 linux shell 或是 Windows 的 console，你可以開始輸入 cshell  的指令。

## 指令
目前的版本支援以下四個命令:

### login
當你第一次使用這個命令列工具時，應該先下 login 這個指令。此時工具列會要求你輸入帳號和密碼，並試著幫你登入 COIMOTION。如果登入成功，以後使用 coim_node 時就不需再登入，因為 coim_node 已經幫你把 token 記錄在 'config.json'。

    > coim > login
    Account Name: [your_username]
    Password: [your_password]

### logout
這個命令會將你登出 COIMOTION，並銷燬 token。

### send
這將是你最常用的命令。當你下了 send 的指令，coim_node 會再詢問你所要存取的 API 服務以及所需的參數。API 服務的格式是 "wa/rs/op/[id]"，而參數必須以 JSON 物件的方式輸入。如果你的參數很多，你可以用好幾行來輸入。只需按 'enter' 鍵，螢幕游標就會換行讓你繼續輸入直到你輸入 '}' 作為結尾。如果你的 API 要求不需要任何參數，那麼在 coim_node 詢問你參數時直接按 'enter' 就可以。

    > coim > send
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

### exit
離開並關閉這個命令工具。

## Remote Entities
------------------
從 0.1 版開始，COIMOTION 團隊試圖提供開發者更高階的程式開發介面，讓存取遠端服務就像存取本地物件一樣的方便。我們將這個高階的程式開發介面稱之為 **Remote Entity API (REA)**。利用 REA，開發者不再需要記憶冗長的 API 網址路徑。相反地，REA 協助開發者將遠端的資源 (resource) 視為一種類別 (class)，而資源下的實際資料則成為類別的實例 (instance)。
  
假設你在 COIMOTION 上有一個內容集稱為 'BookStore'，而該內容集下有一個繼承 'cms/page' 的資源成為 'book。那麼你可以用以下的方法來控制這個遠端的內容集：（你可以用 **cshell**來測試，不一定要先撰寫程式）

    1  > node cshell
    2 
    3  coim > f = coim.getRepo('BookStore');
    4  coim > myRepo = f.result;
    5  coim > f = myRepo.findEntity('book', 108);
    6  coim > book = f.result;
    7  coim > console.log( JSON.stringify(book) );
    8  coim > book.title = 'A New Title';
    9  coim > book.save();
    
第一行啟動 cshell 這個命令列工具，第三行則試圖取得 'BookStore' 這個內容集的連線內容。當執行 coim.getRepo() 時，REA 會立刻回傳一個稱為 future 的物件。有了這個 future 的物件，我們就不必用 callback。future 有點像 promise，當原有的函式執行完成時，執行節鬼會填入 future.result 中。利用這個原理，我們在第四行取得真正的 Repo 物件。

在第五行，我們用剛剛取得的 Repo 物件來進一步取得識別碼為 108 號的這本書。同樣的，立刻回傳的是一個 future，我們在第六行透過這個 future 來取得實際的書本資料。在第七行，我們將這本書完整的資料列印到 console 中。

第六行取得的實體物件稱為 entity，它是遠端物件在本地端的複製品。在第八行中我們把這個本地實體的標題 (title) 改變，並在第九行時將結果存回遠端 (COIMOTION data store)。

以上的範例是我們在程式中常會做的動作。神奇的是，我們雖然存取的是遠端的服務，但程式碼中完全看不到任何 API 的服務網址，整個程式就像是在本地端執行的一樣。

### The Remote Entity APIs (REA)
接著就來說明 REA。基本上 REA 定義了二種物件：Repo 和 Entity。

Repo 物件可以視為是遠端內容集在本地端的分身，而 Entity 物件則是遠端資源 (resource) 在本地端的分身。

#### Repo 物件
每一個 Repo 物件都提供了以下的功能：

+ **createEnty(name, data, callback)** : 這個函式會在遠端的 COIMOTION data store 上建立一個實體 (entity)。**name** 參數是資源代碼，而 **data** 參數則包含了資源物件的起始值。

+ **deleteEnty(enty, callback)** : 這個函式會將 entity 永久的從遠端刪除。**enty** 是本地端的 entity 實體。

+ **findEnty(name, id, callback)** : 這個函式會詢問遠端名為 'name' 的資源是否有識別碼為 'id' 的物件。如果該物件存在，就會在本地端建立該實體的分身。

+ **saveEnty(enty, callback)** : 將本地端對實體（分身）所做的任何變動存回遠端。

+ **listEnties(name, params, callback)** : 列出遠端名為 'name' 的資源下，所有符合條件的實體 (entity)。過濾條件可設定於 **params** 參數中。請注意傳回值是個 Javascript 的陣列，且內容只是一般的 Javascript 物件，而不是遠端物件的分身 (entity)。

+ **api(apiPath, params, callback)** : 與 coim.send() 這個函式的功能類似，是簡化版。

#### 實體 (Entity)
每一個 Entity 實體都提供了以下的功能：

+ **getId()** : 傳回實體識別碼

+ **del()** : 將實體物件從遠端永久的移除

+ **save(callback)** : 將本地端對實體物件所做的異動存回遠端。

#### 網頁實體 (Page Entity)
對於能識別的資源，REA 會對所產生的實體 (entity)擴增它的功能。例如任何繼承 cms/page 的資源，其所產生的實體 (entity) 被稱為網頁實體 (page entity)。網頁實體除了原有的實體功能外，還有其特有的功能：

+ **attach(params, files, callback)** : 附加檔案到網頁實體上。

+ **detach(cnID, callback)** : 移除附加檔。其中 cnID 為附加檔的是別碼，當初在呼叫 attach() 時，會將 cnID 經由 callback function 傳回。

+ **listAux(nType, callback)** : 列出網頁實體的附加檔。關於網頁實體的附加檔，請參考 COIMOTION 官網上有關 cms/page/listAux 的 API 文件。

+ **tag(tagWords, callback)** : 標註文字（標籤）到網頁實體上，其中 'tagWords' 必須是個 Javascript 的陣列。如果只有一個標籤，則傳入只有一個標籤的陣列。

+ **untag(tagWords, callback)** : 移除網頁實體上的標註文字（標籤）。

+ **addGeo(geData, callback)** : 在網頁實體上標記一個地理位置。

+ **findGeo(id, callback)** : 回傳網頁實體上所標記、識別碼為 id 的地理位置。傳回值將是一個實體物件 (geo entity)。

+ **listGeo(params, callback)** : 傳回所有標記在網頁實體上的地理位置。傳回值是一個陣列，陣列內容只是一般的 Javascript 物件，而不是實體 (entity)。

#### 地理位置實體 (Geo Entity)
與網頁實體類似，任何由繼承 cms/geoLoc 的資源所產生的實體被稱為「地理位置實體」。地理位置實體具有以下的特有功能：

+ **createPage(pgData, callback)** : 新增一個附屬的網頁實體到這個地理位置實體上。 **pgData** 參數包含了這個新增的網頁（附屬）實體的起始內容。

+ **findPage(id, callback)** : 回傳地理位置實體上所附帶、識別碼為 id 的網頁實體。傳回值將是一個實體物件 (page entity)。

+ **listPages(params, callback)** : 傳回所有附帶在地理位置實體上的網頁。傳回值是一個陣列，陣列內容只是一般的 Javascript 物件，而不是實體 (entity)。

+ **tag(tagWords, callback)** : 標註文字（標籤）到地理位置實體上，其中 'tagWords' 必須是個 Javascript 的陣列。如果只有一個標籤，則傳入只有一個標籤的陣列。

+ **untag(tagWords, callback)** : 移除地理位置實體上的標註文字（標籤）。

#### The Promise
本地端的內容集 (Repo) 和實體 (Entity) 分身都支援了 promise 的功能。Promise 的實作採用了 bluebird.js 這個模組。以下提供使用 promise 的範例：

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
