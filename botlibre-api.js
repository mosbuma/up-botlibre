// https://www.botlibre.com/api.jsp

// https://github.com/BotLibre/BotLibre/blob/master/sdk/java/src/org/botlibre/sdk/SDKConnection.java
// https://github.com/BotLibre/BotLibre/tree/master/sdk/java/src/org/botlibre/sdk/config

// xmldom documentation: https://www.npmjs.com/package/xmldom
// xmldocument documentation: https://developer.mozilla.org/en-US/docs/Web/API/XMLDocument

// axios documentation: https://www.npmjs.com/package/axios


const axios = require("axios");

botlibreAPI = function(username, password, appid, botid) {
  this.user;
  this.appid;
  this.token;
  this.botid;
}

botlibreAPI.prototype.login = function(applicationid, username, password, botid) {
  var url = 'http://www.botlibre.com/rest/api/form-check-user?user='+username+'&password='+password+'&applicationid='+applicationid;

  return axios({
    method: 'get',
    url: url,
  }).then(function(response) {
    var DOMParser = require('xmldom').DOMParser;
    var document = new DOMParser().parseFromString(response.data);

    this.appid=applicationid;
    this.user=username;
    this.botid=botid;
    this.token=document.documentElement.getAttribute('token');

    return true;
  }.bind(this)).catch(error => {
    console.log('ERROR: botlibreAPI.login - ' + error);
    return false;
  });
}

botlibreAPI.prototype.addCredentials = function(document) {
  document.documentElement.setAttribute('user', this.user);
  document.documentElement.setAttribute('token',this.token);
  document.documentElement.setAttribute('application', this.appid);

  return;
}

botlibreAPI.prototype.POST = function(url, document) {
  // var xml = XmlService.getPrettyFormat().format(document);

  var XMLSerializer = require('xmldom').XMLSerializer
  var xml = new XMLSerializer().serializeToString(document);
  // console.log(JSON.stringify(xml));

  axios.defaults.headers.post['Content-Type']='application/xml';
  return axios.post(url, xml).then(function(response) {
    return response.data;
  }.bind(this)).catch(error => {
    console.log('ERROR: botlibreAPI.POST - ' + error);
    return false;
  });
}

botlibreAPI.prototype.chatWithBot = function(message, opt_conversation) {
  var url = 'http://www.botlibre.com/rest/api/chat';

  var DOMImplementation = require('xmldom').DOMImplementation
  var document = new DOMImplementation().createDocument(null, "chat");

  document.documentElement.setAttribute('instance', this.botid);
  if(opt_conversation!=null) {
  //   root.setAttribute('conversation', opt_conversation)
    document.documentElement.setAttribute('conversation', opt_conversation);
  }

  var messagenode = document.createTextNode(message);
  var child = document.createElement('message')
  child.appendChild(messagenode);
  document.documentElement.appendChild(child);
  this.addCredentials(document);

  return this.POST(url, document).then(function(result) {
    if(false==result) {
      console.log('ERROR: botlibreAPI.prototype.chatWithBot - unable to chat')
      return false
    }

    var DOMParser = require('xmldom').DOMParser;
    var document = new DOMParser().parseFromString(result);
    var conversation=document.documentElement.getAttribute('conversation');
    var message = document.documentElement.getElementsByTagName("message")[0];

    var reply=message.childNodes[0].nodeValue;
    var data = {'message':reply, 'conversation':conversation };
    return data;
  }).catch(error => {
    console.log('ERROR: botlibreAPI.chatWithBot - ' + error);
    return false;
  });
}

botlibreAPI.prototype.getInstances = function() {
  var url = 'http://www.botlibre.com/rest/api/get-instances';

  var DOMImplementation = require('xmldom').DOMImplementation
  var document = new DOMImplementation().createDocument(null, "browse");
  document.documentElement.setAttribute('userFilter', this.user)
  document.documentElement.setAttribute('typeFilter', 'personal')
  this.addCredentials(document);

  return this.POST(url, document).then(result=>{
    var list = [];
    var DOMParser = require('xmldom').DOMParser;
    var document2 = new DOMParser().parseFromString(result);

    var scripts = document2.documentElement.getElementsByTagName('instance');
    for (var i = 0; i < scripts.length; i++) {
      var id = scripts[i].getAttribute("id");
      var name = scripts[i].getAttribute("name");
      list.push({'id':id, 'name':name });
    }

    return list;
  }).catch(error => {
    console.log('ERROR: botlibreAPI.getInstances - ' + error);
    return false;
  });
}

botlibreAPI.prototype.getInstance = function() {
  var url = 'http://www.botlibre.com/rest/api/check-instance';

  var DOMImplementation = require('xmldom').DOMImplementation
  var document = new DOMImplementation().createDocument(null, "instance");
  document.documentElement.setAttribute('id', this.botid)
  this.addCredentials(document);

  return this.POST(url, document).then(result=>{
    var DOMParser = require('xmldom').DOMParser;
    var document2 = new DOMParser().parseFromString(result);
    return document2;
  }).catch(error => {
    console.log('ERROR: botlibreAPI.getInstance - ' + error);
    return false;
  });
}

botlibreAPI.prototype.getLibraryScripts = function() {
  var url = 'http://www.botlibre.com/rest/api/get-scripts';

  var DOMImplementation = require('xmldom').DOMImplementation
  var document = new DOMImplementation().createDocument(null, "browse");

  document.documentElement.setAttribute('userFilter', this.user)
  document.documentElement.setAttribute('typeFilter', 'personal')
  this.addCredentials(document);

  return this.POST(url, document).then(function(result) {
    var list = [];
    var DOMParser = require('xmldom').DOMParser;
    var document2 = new DOMParser().parseFromString(result);

    var scripts = document2.documentElement.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      script = scripts[i];
      var id = script.getAttribute("id");
      var name = script.getAttribute("name");
      list.push({'id':id, 'name':name });
    }

    return list;
  }).catch(error => {
    console.log('ERROR: botlibreAPI.getLibraryScripts - ' + error);
    return false;
  });
}

botlibreAPI.prototype.getBotScripts = function(instance) {
  var url = 'http://www.botlibre.com/rest/api/get-bot-scripts';

  this.addCredentials(instance);
  return this.POST(url, instance).then(scriptConfig=>{
    var list = [];
    var DOMParser = require('xmldom').DOMParser;
    var document = new DOMParser().parseFromString(scriptConfig);
    var scripts = document.documentElement.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      script = scripts[i];
      var id = script.getAttribute("id");
      var name = script.getAttribute("name");
      list.push({'id':id, 'name':name });
    }

    return list;
  }).catch(error => {
    console.log('ERROR: botlibreAPI.getBotScripts - ' + error);
    return false;
  });
}

// NB: for now, only looks for scripts owned by the logged in user!
botlibreAPI.prototype.getLibraryScript = function(scriptname) {
  var url = 'http://www.botlibre.com/rest/api/get-scripts';

  var DOMImplementation = require('xmldom').DOMImplementation
  var document = new DOMImplementation().createDocument(null, "browse");

  document.documentElement.setAttribute('userFilter', this.user)
  document.documentElement.setAttribute('typeFilter', 'personal')
  document.documentElement.setAttribute('filter', scriptname)

  this.addCredentials(document);

  return this.POST(url, document).then(function(result) {
    var DOMParser = require('xmldom').DOMParser;
    var document2 = new DOMParser().parseFromString(result);
    var scripts = document2.documentElement.getElementsByTagName('script');
    if(scripts.length>=1) {
      if(scripts.length>1) {
        console.log('WARNING: getLibraryScript - more than one candidate found for script (' + scripts.length + ')!  Using first script.');
      }

      var DOMImplementation = require('xmldom').DOMImplementation
      var document2 = new DOMImplementation().createDocument(null);
      document2.appendChild(scripts[0]);

      return document2;
    } else {
      return false;
    }
  }.bind(this)).catch(error => {
    console.log('ERROR: botlibreAPI.getLibraryScript - ' + error);
    return false;
  });
}

botlibreAPI.prototype.createLibraryScript = function(name, language) { // , source
  var url = 'http://www.botlibre.com/rest/api/create-script';

  var DOMImplementation = require('xmldom').DOMImplementation
  var document = new DOMImplementation().createDocument(null, "script");

  document.documentElement.setAttribute('isPrivate', 'true')
  document.documentElement.setAttribute('language', language) // AIML / Self
  document.documentElement.setAttribute('name', name)
  this.addCredentials(document);

  return this.POST(url, document).then(function(result) {
    var DOMParser = require('xmldom').DOMParser;
    var document2 = new DOMParser().parseFromString(result);
    return document2;
  }).catch(error => {
    console.log('ERROR: botlibreAPI.createLibraryScript - ' + error);
    return false;
  });
}

// Remove the script with the given name from the current bot
botlibreAPI.prototype.deleteLibraryScript = function(script) {
  var url = 'http://www.botlibre.com/rest/api/delete-script';

  this.addCredentials(script);
  return this.POST(url, script).then(function(result) {
    return (result!=false);
  }).catch(error => {
    console.log('ERROR: botlibreAPI.deleteLibraryScript - ' + error);
    return false;
  });
}

botlibreAPI.prototype.getBotScript = function(scriptname) {
  // go get the bot instance
  return this.getInstance(this.botid).then(function(botInstance) {
    if(botInstance==false) {
      console.log('DEBUG: getBotScript - Unable to create bot instance: exiting');
      return false;
    }

    return botInstance;
  }.bind(this)).then(function(botInstance) {
    var url = 'http://www.botlibre.com/rest/api/get-bot-scripts';

    this.addCredentials(botInstance);
    return this.POST(url, botInstance).then(function (scriptConfig) {
      var DOMParser = require('xmldom').DOMParser;
      var document2 = new DOMParser().parseFromString(scriptConfig);
      return document2;
    });
  }.bind(this)).then(function(scriptConfig) {
    var scripts = scriptConfig.documentElement.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      name=scripts[i].getAttribute("name");
      if(name==scriptname) {
        var DOMImplementation = require('xmldom').DOMImplementation
        var script = new DOMImplementation().createDocument(null);
        script.appendChild(scripts[i]);
        return script;
      }
    }

    return false; // script does not exist
  }).catch(error => {
    console.log('ERROR: botlibreAPI.getBotScript - ' + error);
    return false;
  });
}

botlibreAPI.prototype.getLibraryScriptSource = function(script) {
  var url = 'http://www.botlibre.com/rest/api/get-script-source';
  this.addCredentials(script);
  return this.POST(url, script).then(scriptSource=>{
    var DOMParser = require('xmldom').DOMParser;
    var document = new DOMParser().parseFromString(scriptSource);
    return document;
  }).catch(error => {
    console.log('ERROR: botlibreAPI.getLibraryScriptSource - ' + error);
    return false;
  });
}

botlibreAPI.prototype.getBotScriptSource = function(script) {
  var url = 'http://www.botlibre.com/rest/api/get-bot-script-source';

  var scriptId = script.documentElement.getAttribute("id");

  var DOMImplementation = require('xmldom').DOMImplementation
  var document = new DOMImplementation().createDocument(null, "script-source");
  document.documentElement.setAttribute('instance', this.botid )
  document.documentElement.setAttribute('id', scriptId)
  this.addCredentials(document);

  return this.POST(url, document).then(result=> {
    var DOMParser = require('xmldom').DOMParser;
    var scriptsource = new DOMParser().parseFromString(result);
    return scriptsource;
  }).catch(error => {
    console.log('ERROR: botlibreAPI.getBotScriptSource - ' + error);
    return false;
  });
}

botlibreAPI.prototype.saveLibraryScript = function(script, aiml) {
  var scriptid=script.documentElement.getAttribute('id');

  return this.getLibraryScriptSource(script).then((scriptSource)=>{
    if(scriptSource==false) {
      console.log('DEBUG: saveLibaryScript - unable to get script-source');
      return false;
    }

    // replace existing source with new aiml
    var newsource = scriptSource.createElement('source');
    newsource.appendChild(scriptSource.createTextNode(aiml));
    scriptSource.documentElement.replaceChild(newsource, scriptSource.documentElement.getElementsByTagName('source')[0]);

    scriptSource.documentElement.setAttribute('instance', scriptid);
    this.addCredentials(scriptSource);

    url='http://www.botlibre.com/rest/api/save-script-source'
    return this.POST(url, scriptSource).then(result=> {
      if(result==false) {
        console.log('DEBUG: saveLibaryScript - unable to save script-source');
        return false;
      }
      return false!=result;
    });
  }).catch(error => {
    console.log('ERROR: botlibreAPI.saveLibraryScript - ' + error);
    return false;
  });
}

botlibreAPI.prototype.saveBotScript = function(script, aiml) {
  var scriptid=script.documentElement.getAttribute('id');

  return this.getBotScriptSource(script).then(scriptSource=>{
    if(scriptSource==false) {
      console.log('unable to get bot-script-source');
      return false;
    }


    // replace existing source with new aiml
    var newsource = scriptSource.createElement('source');
    newsource.appendChild(scriptSource.createTextNode(aiml));
    scriptSource.documentElement.replaceChild(newsource, scriptSource.documentElement.getElementsByTagName('source')[0]);

    // scriptSource.documentElement.setAttribute('instance', scriptid);
    this.addCredentials(scriptSource);

    url='http://www.botlibre.com/rest/api/save-bot-script-source'
    return this.POST(url, scriptSource).then(result=> {
      if(result!="") {
        console.log('DEBUG: saveBotScript - unable to save script-source');
        return false;
      }

      return true;
    });
  }).catch(error => {
    console.log('ERROR: botlibreAPI.saveBotScript - ' + error);
    return false;
  });
}

botlibreAPI.prototype.upsertBotScript = function(name, aiml) {
  return this.getBotScript(name).then(result=>{
    if(false==result) {
      // bot script does not exist. Create a new script
      // -> first create a minimal self script (the class name defines the script dcument name)
      // -> save the aiml script to this new script

      var DOMImplementation = require('xmldom').DOMImplementation
      var document = new DOMImplementation().createDocument(null, "script-source");
      document.documentElement.setAttribute('instance', this.botid )
      document.documentElement.setAttribute('language', 'self') // AIML / Self
      //  root.setAttribute('isPrivate', 'true')
      // document.documentElement.setAttribute('type', name)

      var selfcode ='state ' + name + ' { }';

      var newsource = document.createElement('source');
      newsource.appendChild(document.createTextNode(selfcode));
      document.documentElement.appendChild(newsource);

      this.addCredentials(document);

      var url = 'http://www.botlibre.com/rest/api/save-bot-script-source';
      return this.POST(url, document).then(result=>{
        if(""!=result) {
          console.log('ERROR: botlibreAPI.upsertBotScript - unable to create new botscript ' + name);
          return false;
        } else {
          console.log('retrieve botscript after create')
          return this.getBotScript(name)
        }
      }).then(result => {
        if(false==result) {
          console.log('ERROR: botlibreAPI.upsertBotScript - unable to retrieve new botscript ' + name);
          return false;
        }

        return result;
      });
    }

    return result;
  }).then(botScript=>{
    if(false==botScript) {
      console.log('ERROR: botlibreAPI.upsertBotScript - unable to access botscript ' + name + ' for update');
      return false;
    }

    return this.saveBotScript(botScript, aiml).then(result => {
      if(false==result) {
        console.log('ERROR: botlibreAPI.upsertBotScript - unable to save botscript ' + name);
      }

      return result;
    });
  }).catch(error => {
    console.log('ERROR: botlibreAPI.upsertBotScript - last resort error ' + error);
    return false;
  });
}

botlibreAPI.prototype.deleteBotScript = function(scriptName) {
  var url = 'http://www.botlibre.com/rest/api/delete-bot-script';

  return this.getBotScript(scriptName).then(function(script) {
    if(script==false) {
      console.log('ERROR: botlibreAPI.deleteBotScript - unable to get bot-script ' + scriptName);
      return false;
    }

    return this.getBotScriptSource(script).then(scriptSource=>{
      console.log(scriptName);
      if(scriptSource==false) {
        console.log('ERROR: botlibreAPI.deleteBotScript - unable to get bot-script-source for ' + scriptName);
        return false;
      }

      var scriptid=script.documentElement.getAttribute('id');
      this.addCredentials(scriptSource);

      return this.POST(url, scriptSource).then(result => {
        if(result!="") {
          console.log('ERROR: botlibreAPI.deleteBotScript - unable to delete bot-script ' + scriptName);
        }

        return (result=="");
      });
    });
  }.bind(this)).catch(error => {
    console.log('ERROR: botlibreAPI.deleteBotScript - last resort error ' + error);
    return false;
  });
}

// duration: week / day
botlibreAPI.prototype.getConversations = function(duration) {
  var url = 'http://www.botlibre.com/rest/api/get-conversations';

  var DOMImplementation = require('xmldom').DOMImplementation
  var document = new DOMImplementation().createDocument(null, "response-search");
  document.documentElement.setAttribute('instance', this.botid)
  document.documentElement.setAttribute('search', 'conversations')
  document.documentElement.setAttribute('duration', duration)
  document.documentElement.setAttribute('restrict', 'none')

  this.addCredentials(document);

  return this.POST(url, document).then(result=> {
    if(false==result) {
      console.log('ERROR: botlibreAPI.deleteBotScript - unable to retrieve conversations');
      return false;
    }

    var DOMParser = require('xmldom').DOMParser;
    var document2 = new DOMParser().parseFromString(result);

    var list = [];
    var conversations = document2.documentElement.getElementsByTagName('conversation');
    for (var i = 0; i < conversations.length; i++) {
      var conversation = conversations[i];
      // logXMLelement(conversation);
      var id = conversation.getAttribute("id");
      var type = conversation.getAttribute("type");
      var inputs = conversation.getElementsByTagName('input');
      for(var inputIdx=0; inputIdx<inputs.length;inputIdx++) {
        var input = inputs[inputIdx];
        var inputId = input.getAttribute("id");
        var inputDate = input.getAttribute("creationDate");
        var inputSpeaker = input.getAttribute("speaker");
        var inputTarget = input.getAttribute("target");
        var inputValue = input.getElementsByTagName("value")[0].textContent

        // console.log("%s/%s/%s/%s/%s", inputId, inputDate, inputSpeaker, inputTarget, inputValue);

        list.push([type, id, inputDate, inputIdx, inputSpeaker, inputTarget, inputValue]);
      }
    }

    return list;

  }).catch(error => {
    console.log('ERROR: botlibreAPI.getConversations - last resort error ' + error);
    return false;
  });
}

// botlibreAPI.prototype.importBotScript = function(script) {
//   var url = 'http://www.botlibre.com/rest/api/import-bot-script';
//   this.addCredentials(script);
//   script.getRootElement().setAttribute('instance', this.botid);
//
//   var result = this.POST(url, script);
//   // Todo: check return value for success
//   return true;
// }
//

module.exports = botlibreAPI;
