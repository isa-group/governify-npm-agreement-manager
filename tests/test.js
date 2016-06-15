'use strict'

var manager = require('../index.js');

console.log(manager);

var translators = manager.translators.sla4oai;

translators.convertFile('tests/petstore.yaml', (data)=>{
  console.log(data);
}, (err) => {
  console.log(err);
});
