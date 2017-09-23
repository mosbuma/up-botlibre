function testScript() {
  return false;
  
  // return API.getLibraryScripts().then(response=>{
  //   if(false!=response) {
  //     console.log(response);
  //   } else {
  //     console.log('ERROR: unable to get library scripts');
  //   };
  // })
  // return API.getLibraryScript('test_create').then(response=>{
  //   if(false!=response) {
  //     var XMLSerializer = require('xmldom').XMLSerializer
  //     var xml = new XMLSerializer().serializeToString(response);
  //     console.log(xml);
  //   } else {
  //     console.log('ERROR: unable to get library script');
  //   };
  //   return response;
  // }).then(libraryScript=> {
  //   if(false!=libraryScript) {
  //     // return API.getLibraryScriptSource(libraryScript).then(source=>{
  //     //   var XMLSerializer = require('xmldom').XMLSerializer
  //     //   var xml = new XMLSerializer().serializeToString(source);
  //     //   console.log(xml);
  //     //
  //     //   return source;
  //     // });
  //
  //     var aiml = "<aiml><!-- comment 1 --></aiml>";
  //     return API.saveLibraryScript(libraryScript, aiml).then(source=>{
  //       var XMLSerializer = require('xmldom').XMLSerializer
  //       var xml = new XMLSerializer().serializeToString(source);
  //       console.log(xml);
  //
  //       return source;
  //     });
  //
  //   } else {
  //     return false;
  //   }
  // });
  // return API.getBotScript('brain_of_pip').then(response=>{
  //   if(false!=response) {
  //     // var XMLSerializer = require('xmldom').XMLSerializer
  //     // var xml = new XMLSerializer().serializeToString(response);
  //     // console.log(xml);
  //   } else {
  //     console.log('ERROR: unable to get bot script');
  //   };
  //   return response;
  // }).then(botScript=> {
  //   // if(false!=botScript) {
  //   //   return API.getBotScriptSource(botScript).then(source=>{
  //   //     var XMLSerializer = require('xmldom').XMLSerializer
  //   //     var xml = new XMLSerializer().serializeToString(source);
  //   //     console.log(xml);
  //   //
  //   //     return source;
  //   //   });
  //   // } else {
  //   //   return false;
  //   // }
  //   var aiml = "<aiml><!-- comment 1 botscript --></aiml>";
  //   return API.saveBotScript(botScript, aiml).then(source=>{
  //     var XMLSerializer = require('xmldom').XMLSerializer
  //     var xml = new XMLSerializer().serializeToString(source);
  //     console.log(xml);
  //
  //     return source;
  //   });
  // });
  // var aiml = "<aiml><!-- comment 1 botscript --></aiml>";
  // return API.saveBotScriptNew('created_by_node_2', aiml).then(source=>{
  //   var XMLSerializer = require('xmldom').XMLSerializer
  //   var xml = new XMLSerializer().serializeToString(source);
  //   console.log(xml);
  //
  //   return source;
  // });
//   return API.createLibraryScript('test_create', 'AIML').then(response=>{
//     if(false!=response) {
//       var XMLSerializer = require('xmldom').XMLSerializer
//       var xml = new XMLSerializer().serializeToString(response);
// //      console.log(xml);
//
//       // console.log(response);
//     } else {      if(false!=scriptConfig)

//       console.log('ERROR: unable to create library script');
//     };
//   }).then(function(result) {
//     return API.getLibraryScript('test_create').then(response=>{
//       if(false!=response) {
//         var XMLSerializer = require('xmldom').XMLSerializer
//         var xml = new XMLSerializer().serializeToString(response);
//         console.log(xml);
//
//         return API.deleteLibraryScript(response).then(response=>{
//           if(""!=response) {
//             console.log('ERROR: unable to delete library script');
//           };
//         })
//
//         // console.log(response);
//       } else {
//         console.log('ERROR: unable to get library script');
//       };
//     })
//   })
  // return API.getInstance().then(response=>{
  //   if(false!=response) {
  //     var XMLSerializer = require('xmldom').XMLSerializer
  //     var xml = new XMLSerializer().serializeToString(response);
  //     console.log(xml);
  //   } else {
  //     console.log('ERROR: unable to get instance');
  //   };
  // })
  // return API.getInstances().then(response=>{
  //   if(false!=response) {
  //     console.log(response);
  //   } else {
  //     console.log('ERROR: unable to get instance');
  //   };
  // })
  // return API.getBotScript('brain_of_pip').then(response=>{
  //   if(false!=response) {
  //     var XMLSerializer = require('xmldom').XMLSerializer
  //     var xml = new XMLSerializer().serializeToString(response);
  //     console.log(xml);
  //   } else {
  //     console.log('ERROR: unable to get instance');
  //   };
  // })
}
