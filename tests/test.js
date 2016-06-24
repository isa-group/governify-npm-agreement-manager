'use strict'

var manager = require('../index.js');
var fs = require('fs');

console.log(manager);

var translators = manager.translators.sla4oai;

translators.convertFile('tests/petstore-pro.yaml', (data)=>{
  //console.log(data);
  fs.writeFile("tests/petstore.ag", data, function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("The file was saved!");
  });
}, (err) => {
  console.log(err);
});
