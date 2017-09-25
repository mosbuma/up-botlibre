# up-botlibre

up-botlibre is a tool that facilitates development of bot scripts on the bot-libre platform
- you can use your favorite text editor to edit the AIML scripts
- up-botlibre monitors a folder with AIML files and uploads changed files to botlibre-api
- you can talk to the bot using the app's cli interface
- also there are some commands to list the bot's scripts and delete scripts from the bot

#installation / use

 1. setup the environment by copying config/default-example.json to config/default.json
 2. fill in your configuration values from botlibre in config/default.json
 3. fill in your folder with AIML files in config/default.json
 4. start with node index.js from the root folder
 5. Happy AIML-ing

#commands in up-botlibre
type ! to get an overview of the available commands

# Todo
- full sync of  files with botlibre by implementing a !sync command
- download of botlibre scripts that are not available locally
- download of all scripts at once for backup
