# coim_node
這是個用來對 COIMOTION API 服務下命令的工具。開發者可以利用這個工具來測試 COIMOTION 所提供的各項 API 服務。

因為執行 COIMOTION API 服務必須有 token，而 token 必須經由登入取得。但是登入 COIMOTION 時必須先將密碼進行 hash&salt 的安全性處理，這使得一些常用的 restful 子端工具像是 Postman 或是 DHC 就不太好用，因此我們建造了這個工具。

## 安裝
    npm install coim_node

## 如何使用
首先要設定 'config.json' 這個設定檔。這個檔案可以在安裝目錄下找到。你必須把子端程式代碼和子端程式金鑰設定到這個檔案中。設定完成後，檔案會像這個樣子：

    {
        "coim_app_code": "code_name_of_your_client_app",
        "coim_app_key": "app_key_of_the_client_app"
    }

一旦完成設定，你就可以開始使用這個工具：

    > cd coim_node
    > node cshell

執行成功，你應該會看到 'coim' 的提示字：

    > coim

這個命令列工具就像 linux shell 或是 Windows 的 console。

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
