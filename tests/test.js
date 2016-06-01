'use strict'

var manager = require('../index.js');

console.log(manager);

var mapper = manager.mappers.sla4oai;

mapper.convertFile('tests/petstore.yaml', (data)=>{
  console.log(data);
}, (err) => {
  console.log(err);
});
