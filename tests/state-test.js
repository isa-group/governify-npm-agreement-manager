'use strict'

var manager = require('../index.js');
var fs = require('fs');
var yaml = require('js-yaml');

console.log(manager);

var translators = manager.translators.sla4oai;
var initializeState = manager.operations.states.initializeState;
var metrics = manager.operations.states.recordsManager.metrics;
var quotas = manager.operations.states.recordsManager.quotas;
var rates = manager.operations.states.recordsManager.rates;

translators.convertFile('tests/petstore-pro.json', (data)=>{
  console.log(data);
  var ag = yaml.safeLoad(data);
  initializeState(ag, (state) => {
      for(var n=0; n<10 ; n++){
        metrics.save(state, "requests", {resource: '/pets', operation: 'get', level: 'account'}, {type: 'static', period: 'secondly'}, n );
      }
      console.log(metrics.get(state, "requests", {resource: '/pets', operation: 'get', level: 'account'}, {type: 'static', period: 'secondly'}));
      console.log(metrics.current(state, "requests", {resource: '/pets', operation: 'get', level: 'account'}, {type: 'static', period: 'secondly'}));

      for(var n=0; n<10 ; n++){
        quotas.save(state, "quotas_requests", {resource: '/pets', operation: 'get', level: 'account'}, true );
      }
      console.log(quotas.get(state, "quotas_requests", {resource: '/pets', operation: 'get', level: 'account'}));
      console.log(quotas.current(state, "quotas_requests", {resource: '/pets', operation: 'get', level: 'account'}));

      for(var n=0; n<10 ; n++){
        rates.save(state, "rates_requests", {resource: '/pets/{id}', operation: 'get', level: 'account'}, true );
      }
      console.log(rates.get(state, "rates_requests", {resource: '/pets/{id}', operation: 'get', level: 'account'}));
      console.log(rates.current(state, "rates_requests", {resource: '/pets/{id}', operation: 'get', level: 'account'}));

      var st = yaml.safeDump(state);
      fs.writeFile("tests/state-petstore.ag", st, function(err) {
          if(err) {
              return console.log(err);
          }

          console.log("The file was saved!");
      });
  }, (err) => {
      console.log(err.toString());
  });

}, (err) => {
  console.log(err);
});
