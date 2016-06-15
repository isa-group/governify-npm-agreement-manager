/*!
 * Copyright(c) 2016 governify Research Group
 * ISC Licensed
 *
 * @author Daniel Artega <darteaga@us.es>
 */

'use strict'
var fs = require('fs');
var yaml = require('js-yaml');

module.exports = {
  convertFile : convertFileOAI2Governify,
  convertString : convertStringOAI2Governify,
  convertObject : convertModelOAI2Governify
}

function convertModelOAI2Governify(oaiModel, successCb, errorCb){
	convertOAI2Governify(oaiModel, successCb, errorCb);
}


function convertModelGovernify2OAI(governifyModel, successCb, errorCb){
	convertGovernify2OAI(governifyModel, successCb, errorCb);
}

function convertFileOAI2Governify(uri, successCb, errorCb){
	fs.readFile(uri, 'utf8', (err, data) => {
		if(err){
			errorCb(err);
		}else{
			try{
				var oaiModel =  yaml.safeLoad(data, 'utf8');
				convertOAI2Governify(oaiModel, successCb, errorCb);
			}catch(e){
				errorCb(e);
			}
		}
	});
}

function convertFileGovernify2OAI (uri, successCb, errorCb){
	fs.readFile(uri, 'utf8', (err, data) => {
		if(err){
			errorCb(err);
		}else{
			try{
				var governifyModel =  yaml.safeLoad(data, 'utf8');
				convertGovernify2OAI(governifyModel, successCb, errorCb);
			}catch(e){
				errorCb(e);
			}
		}
	});
}

function convertStringOAI2Governify(oaiString, successCb, errorCb){
	try{
		var oaiModel =  yaml.safeLoad(oaiString, 'utf8');
		convertOAI2Governify(oaiModel, successCb, errorCb);
	}catch(e){
		errorCb(e);
	}
}


function convertStringGovernify2OAI(governifyString, successCb, errorCb){
	try{
		var governifyModel =  yaml.safeLoad(governifyString, 'utf8');
		convertGovernify2OAI(governifyModel, successCb, errorCb);
	}catch(e){
		errorCb(e);
	}
}

function convertOAI2Governify (oaiModel, successCb, errorCb){
	//add errorCb
	var governifyModel = new governify(
			oaiModel.context.id,
			oaiModel.context.sla,
			oaiModel.context.type == 'plans' ? 'template' : 'agreement',
			new context(
				oaiModel.context.provider,
				oaiModel.context.consumer,
				oaiModel.context.validity ? new validity(oaiModel.context.validity.effectiveDate, oaiModel.context.validity.expirationDate) : null,
				oaiModel.infrastructure,
				new definitions(
					oaiModel.metrics
				)
			),
			new terms(
				new pricing() ,
				{}, //configurations
				{}, //metrics
				{}, //quotas
				{}, //rates
				{} //guarantees
			),
			oaiModel.context.type == 'plans' ? {} : null //creationConstraints
		);

	//processing default pricing

	if(oaiModel.pricing){
		governifyModel.terms.pricing.of[oaiModel.pricing.plan ? oaiModel.pricing.plan : '*'] = new pricingObject(
				oaiModel.pricing.cost,
				oaiModel.pricing.currency,
				new billingObject (oaiModel.pricing.billing, oaiModel.context.validity ? oaiModel.context.validity.effectiveDate : null)
			);
	}
	//processing default configurations

	if(oaiModel.availability){

		var values = {};
		values[oaiModel.pricing.plan ? oaiModel.pricing.plan : '*'] = {of: oaiModel.availability};
		governifyModel.terms.configurations['availability'] = new configuration(values);

	}
	for(var conf in oaiModel.configuration){
		var values = {};
		values[oaiModel.pricing.plan ? oaiModel.pricing.plan : '*'] = {of: oaiModel.configuration[conf] };
		governifyModel.terms.configurations[conf] = new configuration(values);
	}

	//Processing default quotas

	if(oaiModel.quotas){
		processQuotas(oaiModel.quotas, plan, governifyModel);
	}

	//proccessing default rates

	if(oaiModel.rates){
		processRates(oaiModel.rates, plan, governifyModel);
	}

	//processig default guarantees

	if(oaiModel.guarantees){
		processGuarantees(oaiModel.guarantees, plan, governifyModel);
	}

	//processing plans

	if(oaiModel.plans){

		for( var plan in oaiModel.plans){

			if(oaiModel.plans[plan].availability){
				governifyModel.terms.configurations['availability'].values[plan] = {of: oaiModel.plans[plan].availability};
			}
			if(oaiModel.plans[plan].configuration){
				for(var conf in oaiModel.plans[plan].configuration){
					if(governifyModel.terms.configurations[conf]){
						governifyModel.terms.configurations[conf].values[plan] = {of: oaiModel.plans[plan].configuration[conf] };
					}else{
						var values = {};
						values[plan] = {of: oaiModel.plans[plan].configuration[conf] };
						governifyModel.terms.configurations[conf] = new configuration(values);
					}
				}
			}

			if(oaiModel.plans[plan].pricing){
				governifyModel.terms.pricing.of[plan] = new pricingObject(
					oaiModel.plans[plan].pricing.cost ? oaiModel.plans[plan].pricing.cost : oaiModel.pricing.cost,
					oaiModel.plans[plan].pricing.currency ? oaiModel.plans[plan].pricing. currency : oaiModel.pricing.currency,
					new billingObject (
						oaiModel.plans[plan].pricing.billing ? oaiModel.plans[plan].pricing.billing : oaiModel.pricing.billing,
						oaiModel.context.validity ? oaiModel.context.validity.effectiveDate : null)
				);
			}

			//processing plan quotas:
			processQuotas(oaiModel.plans[plan].quotas, plan, governifyModel);

			//processing plan rates:
			processRates(oaiModel.plans[plan].rates, plan, governifyModel);

			//processing plan guarantees
			processGuarantees(oaiModel.plans[plan].guarantees, plan, governifyModel);

			governifyModel.creationConstraints["cc_" + plan] = new creationConstraints(
					new constraint(plan)
				)
		}
	}

	successCb( yaml.safeDump(governifyModel) );
}


function processQuotas(quotas, plan, governifyModel){

	for (var path in quotas){
		for(var operation in quotas[path]){
			for(var m in quotas[path][operation]){

				if(!governifyModel.terms.metrics[m])
					governifyModel.terms.metrics[m] = new metric(m);

				if(!governifyModel.terms.quotas['quotas_' + m])
					governifyModel.terms.quotas['quotas_' + m] = new quota(m);

				for(var li in quotas[path][operation][m]){
					var name = createScope (plan, path, operation, quotas[path][operation][m][li].scope);

					if(!governifyModel.terms.quotas['quotas_' + m].of[name]){
						governifyModel.terms.quotas['quotas_' + m].of[name] = {
							limits: [
								new limit(quotas[path][operation][m][li].max, quotas[path][operation][m][li].period ? quotas[path][operation][m][li].period : null )
							]
						}
					}else{
						governifyModel.terms.quotas['quotas_' + m].of[name].limits.push(
								new limit(quotas[path][operation][m][li].max, quotas[path][operation][m][li].period ? quotas[path][operation][m][li].period : null )
							);
					}

				}
			}
		}
	}
}

function processRates(rates, plan, governifyModel){

	for (var path in rates){
		for(var operation in rates[path]){
			for(var m in rates[path][operation]){

				if(!governifyModel.terms.metrics[m])
					governifyModel.terms.metrics[m] = new metric(m);

				if(!governifyModel.terms.rates['rates_' + m])
					governifyModel.terms.rates['rates_' + m] = new rate(m);

				for(var li in rates[path][operation][m]){
					var name = createScope (plan, path, operation, rates[path][operation][m][li].scope);

					if(!governifyModel.terms.rates['rates_' + m].of[name]){
						governifyModel.terms.rates['rates_' + m].of[name] = {
							limits: [
								new limit(rates[path][operation][m][li].max, rates[path][operation][m][li].period ? rates[path][operation][m][li].period : null )
							]
						}
					}else{
						governifyModel.terms.rates['rates_' + m].of[name].limits.push(
								new limit(rates[path][operation][m][li].max, rates[path][operation][m][li].period ? rates[path][operation][m][li].period : null )
							);
					}

				}
			}
		}
	}
}

function processGuarantees(guarantees, plan, governifyModel){
	for (var path in guarantees){
		for(var operation in guarantees[path]){

			for(var o in guarantees[path][operation] ){

				var m = guarantees[path][operation][o].objective.split(' ')[0];

				if(!governifyModel.terms.metrics[m])
					governifyModel.terms.metrics[m] = new metric(m);

				if(!governifyModel.terms.guarantees['guarantees_' + m])
					governifyModel.terms.guarantees['guarantees_' + m] = new guarantee();

				var name = createScope (plan, path, operation, guarantees[path][operation][o].scope);

				governifyModel.terms.guarantees['guarantees_' + m].of[name] = new objective(
						guarantees[path][operation][o].objective,
						guarantees[path][operation][o].window,
						guarantees[path][operation][o].period
					);
			}
		}
	}
}

function convertGovernify2OAI(governifyModel, successCb, errorCb){
	successCb("convertGovernify2OAI");
}

function createScope (plan, path, operation, level){
	return    (plan ? plan : '*') + ','
			+ (path == 'global' ? '*' : path) + ','
		    + (operation == 'global' ? '*' : operation) + ','
		    + (level ? level : 'account');
}

/** GOVERNIFY MODEL **/

function governify(id, version, type, context, terms, creationConstraints){
	this.id = id;
	this.version = version;
	this.type = type;
	this.context = context;
	this.terms = terms;
	if(creationConstraints)
		this.creationConstraints = creationConstraints;
}

function context(provider, consumer, validity, infrastructure, definitions){
	this.provider = provider;
	if(consumer)
		this.consumer = consumer;
	if(validity)
		this.validity = validity;
	this.infrastructure = infrastructure;
	this.definitions = definitions;
}

function validity(init, end){
	this.init = init;
	this.end = end;
}

function definitions(schemas){
	this.schemas = schemas;
	this.scopes = oaiScopes();
}

function oaiScopes(){
	return {
		api: {
			resource: {
				description: 'Defines the path in which limits will be checked',
				type: 'string'
			},
			operation: {
				description: 'Defines the operations in which limits will be checked',
				type: 'string'
			}
		},
		oai: {
			level: {
				description: 'Defines the level inside the organization in which limits will be checked',
          		type: 'string'
			}
		},
		offering: {
			plan: {
				description: 'Defines diferent levels of service that are provided',
				type: 'string'
			}
		}
	}
}
function terms(pricing, configurations, metrics, quotas, rates, guarantees){
	this.pricing = pricing;
	this.configurations = configurations;
	this.metrics = metrics;
	this.quotas = quotas;
	this.rates = rates;
	this.guarantees = guarantees;
}

function configuration (values){
	this.scope = [{ '$ref' : "#/context/definitions/scopes/offering/plan" }];
	this.values = values;
}

function pricing(){
	this.scope = [{ '$ref' : "#/context/definitions/scopes/offering/plan" }];
	this.of = {};
}

function pricingObject(cost, currency, billing){
	this.cost = cost;
	this.currency = currency;
	this.billing = billing;
}

function billingObject(period, init){
	this.period = period;
	if(init)
		this.init = init;
}

function quota(metric){
	this.scope = [
		{$ref: "#/context/definitions/scopes/offering/plan" },
		{$ref: "#/context/definitions/scopes/api/resource"},
		{$ref: "#/context/definitions/scopes/api/operation"},
		{$ref: "#/context/definitions/scopes/oai/level"}
	];

	this.over = {$ref: "#/terms/metrics/" + metric};

	this.of = {};

}

function rate(metric){
	this.scope = [
		{$ref: "#/context/definitions/scopes/offering/plan" },
		{$ref: "#/context/definitions/scopes/api/resource"},
		{$ref: "#/context/definitions/scopes/api/operation"},
		{$ref: "#/context/definitions/scopes/oai/level"}
	];

	this.over = {$ref: "#/terms/metrics/" + metric};

	this.of = {};
}

function guarantee (){
	this.scope = [
		{$ref: "#/context/definitions/scopes/offering/plan" },
		{$ref: "#/context/definitions/scopes/api/resource"},
		{$ref: "#/context/definitions/scopes/api/operation"},
		{$ref: "#/context/definitions/scopes/oai/level"}
	];

	this.of = {};
}

function objective (objective, window, period ){
	this.objective = objective;
	this.window = {
		type: window,
		period: period
	}
}

function limit(max, period){
	this.max = max;
	if(period)
		this.period = period;
}

function metric(metric){
	this.schema = {$ref: "#/context/definitions/schemas/" + metric}

	this.scope = [
		{$ref: "#/context/definitions/scopes/api/resource"},
		{$ref: "#/context/definitions/scopes/api/operation"},
		{$ref: "#/context/definitions/scopes/oai/level"}
	]
}

function creationConstraints(constraint, qualifyCondition){
	this.constraint = constraint;
	if(qualifyCondition)
		this.qualifyCondition = qualifyCondition;
}

function constraint(of){
	this.over = { $ref: "#/context/definitions/scopes/offering/plan" };
	this.of = of;
}
