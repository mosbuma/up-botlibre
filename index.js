
var botlibreapi = require('./botlibre-api.js')
var fs = require('fs')
var config = require('config');
var path = require('path');
var fs = require('fs');

var watch = require('watch')
var gWatchIgnorefile = ''; // do not respond to events regarding this file (used during download from botlibre);

var botlibreConfig = config.get('botlibre');
var monitorConfig = config.get('monitor');

var conversation_id = null; // given by bot after first message

// tools & utils
var Reset = "\x1b[0m"; // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
var Bright = "\x1b[1m";
var Dim = "\x1b[2m"
var Reverse = "\x1b[7m";

var logprogress = message => {
  console.log(Dim + message + Reset);
}

logprogress('Monitoring files in directory ' + monitorConfig.directory);
watch.createMonitor(monitorConfig.directory, function (monitor) {
  // monitor.files['/home/mikeal/.zshrc'] // Stat object for my zshrc.
  monitor.on("created", function (f, stat) {

    if(f==gWatchIgnorefile) {
      // logprogress('ignored new file ' + f);
      gWatchIgnorefile = ""
      return;
    }
    // Handle new files
    var scriptname = getBasename(f);
    upload_script(f, scriptname).then(result => {
      if(false!=result) {
        logprogress('OK: script ' + scriptname + ' uploaded from file' + fullname);
      } else {
        logprogress('ERROR: unable to upload script ' + scriptname);
      };
    })
  })
  monitor.on("changed", function (f, curr, prev) {
    if(f==gWatchIgnorefile) {
      // logprogress('ignored changes to ' + f);
      gWatchIgnorefile = ""
      return;
    }

    // Handle file changes
    var scriptname = getBasename(f);
    upload_script(f, scriptname).then(result => {
      if(false!=result) {
        logprogress('OK: script ' + scriptname + ' uploaded from file' + f);
      } else {
        logprogress('ERROR: unable to upload script ' + scriptname);
      };
    })
  })
  monitor.on("removed", function (f, stat) {
    logprogress('removed: watch file is ' + gWatchIgnorefile + ' vs ' + f );
    if(f==gWatchIgnorefile) {
      // gWatchIgnorefile = ""
      return;
    }

    // Handle removed files
    // delete_script(f);
    logprogress("File " + f + "has been deleted. Use !delete to remove the file at botlibre manually");
  })
  // monitor.stop(); // Stop watching
})

var stdin = process.openStdin();

var API = new botlibreAPI();
API.login(botlibreConfig.appid, botlibreConfig.user, botlibreConfig.password, botlibreConfig.botid).then(result => {
  if(!result) {
    logprogress('ERROR: unable to login to botlibre API');
  } else {
    logprogress('Bot at your service!')
  }
}).then(result=>{
  return !API.chatWithBot('intro').then(response=> {
    if(false!=response) {
      console.log(Bright+response.message+Reset);
      if(response.conversation) {
        conversation_id = response.conversation;
      }
    } else {
      logprogress('ERROR: unable to chat with the bot');
    };
  })
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
        logprogress('ERROR: unable to chat with the bot');
      };
    })
  }
});

var processcommand = command => {
  var items = command.split(' ');
  switch(items[0]) {
    case 'list':
      API.getInstance().then(instance=>{
        if(false!=instance) {
          API.getBotScripts(instance).then(list => {
            logprogress('Scripts @ botlibre:');
            if(false!=list) {
              for(var i=0;i<list.length;i++) {
                logprogress(list[i].name);
              }
            }
          });
        };
      }).catch(error => {
        console.log('ERROR: botlibreAPI.list - ' + error);
        return false;
      });
  break;
    case 'delete':
    case 'del':
      if(items.length<2) return;
      logprogress('delete ' + items[1]);
      API.deleteBotScript(items[1]).then(result => {
        if(false!=result) {
          logprogress('script ' + items[1] + ' deleted');
        } else {
          logprogress('ERROR: unable to delete script ' + items[1]);
        }
      });
      break;
    case 'download':
    case 'down':
      if(items.length!=2) {
        logprogress("usage !down[load] scriptname [whitespace is not allowed in the scriptname]");
        return;
      }

      var scriptname = items[1];
      var target = path.join(monitorConfig.directory, scriptname + '.aiml');

      download_script(scriptname, target).then(result => {
        if(false!=result) {
          logprogress('script ' + scriptname + ' downloaded to file ' + target);
        } else {
          logprogress('ERROR: unable to download script ' + scriptname);
        }
      });

      break;
    case 'up':
    case 'upload':
      if(items.length!=2) {
        logprogress("usage !up(load) filename [whitespace is not allowed in the filename]");
        return;
      }

      var fullname = path.join(monitorConfig.directory, items[1]);
      var scriptname = getBasename(fullname);

      upload_script(fullname, scriptname).then(result => {
        if(false!=result) {
          logprogress('script ' + scriptname + ' uploaded from file' + fullname);
        } else {
          logprogress('ERROR: unable to upload script ' + scriptname);
        }
      });
      break;
    case 'reset':
      conversation_id=null;
      logprogress('conversation has been reset!')

      API.chatWithBot('intro').then(response=> {
        if(false!=response) {
          console.log(Bright+response.message+Reset);
          if(response.conversation) {
            conversation_id = response.conversation;
          }
        } else {
          logprogress('ERROR: unable to chat with the bot');
        };
      })

      break;
    default:
      logprogress('valid commands are:')
      logprogress('  !list -> show names of all scripts')
      logprogress('  !reset -> forget conversation')
      logprogress('  !down[upload] <filename> -> download script from botlibre')
      logprogress('  !up[load] <filename> -> upload script to botlibre')
      logprogress('  !delete <scriptname> -> delete script with given name at botlibre')
      break;
  }
}

var getBasename = filename => {
  return path.basename(filename, path.extname(filename)).replace(/ /g, '_');
}

var upload_script = (fullname) => {
  var scriptname = getBasename(fullname)

  return new Promise(function(resolve, reject) {
    fs.readFile(fullname, 'UTF-8', (err, data) => {
        if (err) {
          logprogress('ERROR: unable to open ' + fullname + '(' + err + ')');
          reject(err);
        } else {
          resolve(data);
        }
    });
  }).then(result=>{
     return API.upsertBotScript(scriptname, result);
  }).then(source=>{
    if(false==source) {
      return false;
    } else {
      return true;
    }
  }).catch(error => {
    console.log('ERROR: unable to upload botscript ' + scriptname +' - ' + error);
    return false;
  });
}

var download_script = (scriptname, targetname) => {
  gWatchIgnorefile = targetname;

  return API.getBotScript(scriptname).then(response=>{
    if(false==response) {
      logprogress('ERROR: unable to get botscript ' + scriptname);
    };
    return response;
  }).then(botScript=> {
    return API.getBotScriptSource(botScript);
  }).then(source=>{
    if(false==source) {
      logprogress('ERROR: download_scipt - unable to get bot script ' + scriptname);
      return false;
    }
    aiml = source.documentElement.getElementsByTagName("source")[0].childNodes[0].nodeValue;

    return new Promise(function(resolve, reject) {
      fs.writeFile(targetname, aiml, function(err) {
          if (err) {
            logprogress('ERROR: unable to write botscript ' + scriptname);
            reject(err);
          } else {
            logprogress('Botscript ' + scriptname + ' was saved as ' + targetname);
            resolve(true);
          }
      });
    })
  }).catch(error => {
    console.log('ERROR: unable to write botscript ' + scriptname +'- ' + error);
    return false;
  });
}

var delete_script = filename => {
  var basename = getBasename(filename)
  logprogress('deleting  bot script' + basename);

  API.deleteBotScript(basename);
}
