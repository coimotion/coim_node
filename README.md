# coim_node
A command shell to interact with the COIMOTION API engine. COIMOTION developers can use this tool to login into the API engine and send API requests.

Because passwords should be hashed and salted before they're sent to the API engine during the login process, client side tools such as Postman or DHC are not well suited to command the API engine. Also the COIMOTION API engine may change tokens in the same session, and Postman or DHC have no help in that regard. That's why we build this tool.

## Install
npm install coim_node

## Usage
First of all, you have to tell coim_node how to talk with COIMOTION. Go to the install directory, you can find a 'config.json' file. In the file, you should enter your client-app code as the value of the "coim_app_code" property. The app key of your client app goes to the "coim_app_key" property. Your 'config.json' file should look like:

    {
        "coim_app_code": "code_name_of_your_client_app",
        "coim_app_key": "app_key_of_the_client_app"
    }

Once you have set up the 'config.json' file properly, you can run

    > node coim_node
    
Now you can enter commands just like how you do with a Linux shell or Windows console. At the current version, coim_node only supports four commands.

### login
If this is the first time you use coim_node, you should do login first. Just type 'login' in the command line, coim_node will ask for your account name and password and try to do login for you. If login is successful, coim_node will save your token and you don't have to do login again (even if you have exited the program) unless you do logout.

### logout
Simply type 'logout' in the command line, and coim_node will log you out and descroy the token.

### send
Most of the time, 'send' is the only command you need. When you type 'send' (and hit enter), coim_node will ask what API request along with the parameters needed to be sent over to the COIMOTION API engine. API takes the format as: "wa/rs/op/[id]", and parameters should be wrapped as a JSON object. If your API request does not need any parameters, simply enter 'return'.

### exit
This command will exit the program.
