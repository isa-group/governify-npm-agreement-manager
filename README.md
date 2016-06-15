# Governify NPM Agreement Manager

NPM Module to manage governify agreements with translators, parsers, and analysis functions

## INSTALL

```
npm install governify-agreement-manager --save
```

## TRANSLATORS USAGE

Translator transforms agreement documents from external of governify model to Governify Model, e.g. SLA4OAI Model

### FROM String

```
var agreementManager = require('governify-agreement-manager');
var translator = agreementManager.translators.sla4oai;

var sla4oaiString  = '...';

translator.convertString(sla4oaiString, (data)=>{

      //SUCCESS ACTIONS

},(err)=>{

     //ERRORS ACTIONS

});
```

### FROM File

```
var agreementManager = require('governify-agreement-manager');
var translator = agreementManager.translators.sla4oai;

var sla4oaiUri  = './data/plans.yaml';

translator.convertFile(sla4oaiUri, (data)=>{

      //SUCCESS ACTIONS

},(err)=>{

     //ERRORS ACTIONS

});
```
### FROM Object

```
var agreementManager = require('governify-agreement-manager');
var translator = agreementManager.translators.sla4oai;

var sla4oaiObject  = {
  // ALL CONTENT
};

translator.convertObject(sla4oaiObject, (data)=>{

      //SUCCESS ACTIONS

},(err)=>{

     //ERRORS ACTIONS

});
```
