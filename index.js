
var botlibreapi = require('./botlibre-api.js')
var fs = require('fs')
var config = require('config');
var path = require('path');

var watch = require('watch')

var botlibreConfig = config.get('botlibre');
var monitorConfig = config.get('monitor');

var conversation_id = null; // given by bot after first message

// tools & utils
var Reset = "\x1b[0m"; // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
var Bright = "\x1b[1m";
var Reverse = "\x1b[7m";

console.log('Monitoring files in directory ' + monitorConfig.directory);
watch.createMonitor(monitorConfig.directory, function (monitor) {
  // monitor.files['/home/mikeal/.zshrc'] // Stat object for my zshrc.
  monitor.on("created", function (f, stat) {
    // Handle new files
    upload_script(f);
  })
  monitor.on("changed", function (f, curr, prev) {
    // Handle file changes
    upload_script(f);
  })
  monitor.on("removed", function (f, stat) {
    // Handle removed files
    delete_script(f);
  })
  // monitor.stop(); // Stop watching
})

var stdin = process.openStdin();

var API = new botlibreAPI();
API.login(botlibreConfig.appid, botlibreConfig.user, botlibreConfig.password, botlibreConfig.botid).then(result => {
  if(!result) {
    console.log('ERROR: unable to login to botlibre API');
  } else {
    console.log('Bot at your service!')
  }
});

stdin.addListener("data", function(d) {
  // note:  d is an object, and when converted to a string it will
  // end with a linefeed.  so we (rather crudely) account for that
  // with toString() and then trim()
  var my_input=d.toString().trim();
  if(my_input.substring(0,1)=='!') {
    // command
    processcommand(my_input.substring(1));
  } else {
    API.chatWithBot(my_input, conversation_id).then(response=> {
      if(false!=response) {
        console.log(Bright+response.message+Reset);
        if(response.conversation) {
          conversation_id = response.conversation;
        }
      } else {
        console.log('ERROR: unable to chat with the bot');
      };
    })
  }
});

var processcommand = command => {
  var items = command.split(' ');
  switch(items[0]) {
    case 'up':
      break;
    case 'list':
      API.getInstance().then(instance=>{
        if(false!=instance) {
          API.getBotScripts(instance).then(list => {
            if(false!=list) {
              for(var i=0;i<list.length;i++) {
                console.log(list[i].name);
              }
            }
          });
        };
      })

      break;
    case 'delete':
    case 'del':
      console.log('delete ' + items[1]);
      API.deleteBotScript(items[1]).then(result => {
        if(false!=result) {
          console.log('script ' + items[1] + ' deleted');
        } else {
          console.log('ERROR: unable to delete script ' + items[1]);
        }
      });
      break;
    case 'reset':
      conversation_id=null;
      console.log('>>> conversation has been reset!')
      break;
    default:
      console.log('valid commands are:')
      console.log('  !reset -> forget conversation')
      console.log('  !up -> upload all scripts')
      console.log('  !list -> show names of all scripts')
      console.log('  !delete <scriptname> -> delete script with given name')
      break;
  }
}

var getBasename = filename => {
  return path.basename(filename, path.extname(filename)).replace(/ /g, '_');
}

var upload_script = filename => {
  console.log('uploading ' + filename);
  fs.readFile(filename, 'UTF-8', (err, data) => {
      if (err) {
        console.log('ERROR: unable to open ' + filename + '(' + err + ')');
        return false ;
      }

     var basename = getBasename(filename)
     console.log('saving to bot script ' + basename);
      return API.upsertBotScript(basename, data).then(source=>{
        var XMLSerializer = require('xmldom').XMLSerializer
        var xml = new XMLSerializer().serializeToString(source);
        console.log(xml);

        return source;
      });
  });
}

var delete_script = filename => {
  var basename = getBasename(filename)
  console.log('deleting  bot script' + basename);

  API.deleteBotScript(basename);
}
