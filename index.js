
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

var API = new botlibreAPI(botlibreConfig.baseurl);
API.login(botlibreConfig.appid, botlibreConfig.user, botlibreConfig.password, botlibreConfig.botid).then(result => {
  if(!result) {
    logprogress('ERROR: unable to login to botlibre API');
    return result
  }

  return API.getInstance();
}).then(result=>{
  if(!result) {
    logprogress('ERROR: unable to get bot instance');
    return result
  }

  var name = result.documentElement.getAttribute("name");
  logprogress(name + ' at your service!')

  return API.chatWithBot('intro')
}).then(response=> {
  if(!response) {
    logprogress('ERROR: unable to chat with the bot');
    return response;
  };

  console.log(Bright+response.message+Reset);
  if(response.conversation) {
    conversation_id = response.conversation;
  }
})

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
    case 'priority':
    case 'prio':
      if(items.length<3) return;
      if(items[1]!='up' && items[1]!='down') {
        logprogress("usage !prio[rity] up|down scriptname [whitespace is not allowed in the scriptname]");
        return;
      }

      logprogress('priority ' + items[1] + ' ' + items[2]);
      API.priorityBotScript(items[1]=='up', items[2]).then(result => {
        if(false!=result) {
          logprogress('script ' + items[2] + ' moved ' + items[1]);
        } else {
          logprogress('ERROR: unable to change priority %s for script %s ', items[1], items[2]);
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
      case 'all':
        if(items.length!=2||(items[1]!='down'&&items[1]!='up')) {
          logprogress("usage !all down");
          return;
        }

        API.getInstance().then(instance=>{
          if(false!=instance) {
            API.getBotScripts(instance).then(list => {
              if(false!=list) {
                for(var i=0;i<list.length;i++) {
                  var scriptname = list[i].name;
                  var target = path.join(monitorConfig.directory, scriptname + '.aiml');

                  switch(items[1]) {
                    // case 'up':
                    //   logprogress("uploading "+list[i].name);
                    //   break;
                    case 'down':
                      logprogress("downloading "+list[i].name + ' to ' + target);

                      download_script(scriptname, target).then(result => {
                        if(false!=result) {
                          logprogress('script ' + scriptname + ' downloaded to file ' + target);
                        } else {
                          logprogress('ERROR: unable to download script ' + scriptname);
                        }
                      });

                      break;
                  }
                }
              }
            });
          };
        }).catch(error => {
          console.log('ERROR: botlibreAPI.list - ' + error);
          return false;
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
    case 'stats':
      bot_status();
      break;
    default:
      logprogress('valid commands are:')
      logprogress('  !list -> show names of all scripts')
      logprogress('  !reset -> forget conversation')
      logprogress('  !down[upload] <filename> -> download script from botlibre')
      logprogress('  !up[load] <filename> -> upload script to botlibre')
      logprogress('  !all down -> download all scripts at once from botlibre')
      logprogress('  !delete <scriptname> -> delete script with given name at botlibre')
      logprogress('  !prio[rity] up|down scriptname -> move script up/down in list at botlibre')
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

var bot_status = () => {
  logprogress('getting bot instance statistics');
  API.getInstance().then(response=>{
    if(false!=response) {
      var XMLSerializer = require('xmldom').XMLSerializer
      var xml = new XMLSerializer().serializeToString(response);
      console.log(xml);
    } else {
      console.log('ERROR: unable to get instance');
    };
  })
}
