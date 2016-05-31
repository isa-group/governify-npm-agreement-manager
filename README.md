# Governify Agreement Manager

Module to manage governify agreements with translators, mappers and analysis functions

## INSTALL

```
npm install governify-agreement-manager --save
```

## MAPPERS USAGE

Mappers transforms agreement documents from external of governify model to Governify Model, e.g. SLA4OAI Model

### FROM String

```
var agreementManager = require('governify-agreement-manager');
var mapper = agreementManager.mappers.sla4oai;

var sla4oaiString  = '...';

mapper.convertString(sla4oaiString, (data)=>{

      //SUCCESS ACTIONS

},(err)=>{

     //ERRORS ACTIONS

});
```

### FROM File

```
var agreementManager = require('governify-agreement-manager');
var mapper = agreementManager.mappers.sla4oai;

var sla4oaiUri  = './data/plans.yaml';

mapper.convertFile(sla4oaiUri, (data)=>{

      //SUCCESS ACTIONS

},(err)=>{

     //ERRORS ACTIONS

});
```
### FROM Object

```
var agreementManager = require('governify-agreement-manager');
var mapper = agreementManager.mappers.sla4oai;

var sla4oaiObject  = {
  // ALL CONTENT
};

mapper.convertObject(sla4oaiObject, (data)=>{

      //SUCCESS ACTIONS

},(err)=>{

     //ERRORS ACTIONS

});
```
