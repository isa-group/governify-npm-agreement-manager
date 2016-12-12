/*!
 * Copyright(c) 2016 governify Research Group
 * ISC Licensed
 *
 * @author Daniel Artega <darteaga@us.es>
 */

'use strict'
var fs = require('fs');
var yaml = require('js-yaml');
var deref = require('json-schema-deref');

module.exports = {
    convertFile: convertFileOAI2Governify,
    convertString: convertStringOAI2Governify,
    convertObject: convertModelOAI2Governify
}

function convertModelOAI2Governify(oaiModel, successCb, errorCb) {
    convertOAI2Governify(oaiModel, successCb, errorCb);
}


function convertModelGovernify2OAI(governifyModel, successCb, errorCb) {
    convertGovernify2OAI(governifyModel, successCb, errorCb);
}

function convertFileOAI2Governify(uri, successCb, errorCb) {
    fs.readFile(uri, 'utf8', (err, data) => {
        if (err) {
            errorCb(err);
        } else {
            try {
                var oaiModel = yaml.safeLoad(data, 'utf8');
                convertOAI2Governify(oaiModel, successCb, errorCb);
            } catch (e) {
                errorCb(e);
            }
        }
    });
}

function convertFileGovernify2OAI(uri, successCb, errorCb) {
    fs.readFile(uri, 'utf8', (err, data) => {
        if (err) {
            errorCb(err);
        } else {
            try {
                var governifyModel = yaml.safeLoad(data, 'utf8');
                convertGovernify2OAI(governifyModel, successCb, errorCb);
            } catch (e) {
                errorCb(e);
            }
        }
    });
}

function convertStringOAI2Governify(oaiString, successCb, errorCb) {
    try {
        var oaiModel = yaml.safeLoad(oaiString, 'utf8');
        convertOAI2Governify(oaiModel, successCb, errorCb);
    } catch (e) {
        errorCb(e);
    }
}


function convertStringGovernify2OAI(governifyString, successCb, errorCb) {
    try {
        var governifyModel = yaml.safeLoad(governifyString, 'utf8');
        convertGovernify2OAI(governifyModel, successCb, errorCb);
    } catch (e) {
        errorCb(e);
    }
}

var consumer = "";

function convertOAI2Governify(oaiModel, successCb, errorCb) {
    //add errorCb
    deref(oaiModel, (err, fullSchema) => {

        if (err) return errorCb(err);

        try {
            oaiModel = fullSchema;

            var governifyModel = new governify(
                oaiModel.context.id,
                oaiModel.context.sla + '',
                oaiModel.context.type == 'plans' ? 'template' : 'agreement',
                new context(
                    oaiModel.context.provider,
                    oaiModel.context.consumer,
                    oaiModel.context.validity ? new validity(oaiModel.context.validity.effectiveDate, oaiModel.context.validity.expirationDate) : null,
                    oaiModel.infrastructure,
                    new definitions(
                        oaiModel.metrics,
                        oaiModel.context.consumer
                    )
                ),
                new terms(
                    new pricing(oaiModel.context.type == 'plans' ? 'template' : 'agreement'), {}, //configurations
                    {}, //metrics
                    {}, //quotas
                    {}, //rates
                    {} //guarantees
                ),
                oaiModel.context.type == 'plans' ? {} : null //creationConstraints
            );

            //add logs configuration
            // if(oaiModel.infrastructure.logs){
            //     governifyModel.context.definitions.logs = {};
            //     governifyModel.context.definitions.logs.oai = new logs(oaiModel.infrastructure.logs);
            // }
            //processing default pricing

            if (oaiModel.pricing) {
                governifyModel.terms.pricing.of.push(new pricingObject(
                    oaiModel.pricing.cost,
                    oaiModel.pricing.currency,
                    new billingObject(oaiModel.pricing.billing, oaiModel.context.validity ? oaiModel.context.validity.effectiveDate : null),
                    governifyModel.type != 'agreement' ? {
                        plan: "*"
                    } : null
                ));
            }
            //processing default configurations

            if (oaiModel.availability) {

                var of = [];
                of.push(new configValue({
                    plan: "*"
                }, oaiModel.availability, governifyModel));
                governifyModel.terms.configurations['availability'] = new configuration(of, governifyModel.type);

            }
            for (var conf in oaiModel.configuration) {
                var of = [];
                of.push(new configValue({
                    plan: "*"
                }, oaiModel.configuration[conf], governifyModel));
                governifyModel.terms.configurations[conf] = new configuration(of, governifyModel.type);
            }

            //Processing default quotas

            if (oaiModel.quotas) {
                processQuotas(oaiModel.quotas, oaiModel.context.type == 'plans' ? '*' : null, governifyModel);
            }

            //proccessing default rates

            if (oaiModel.rates) {
                processRates(oaiModel.rates, oaiModel.context.type == 'plans' ? '*' : null, governifyModel);
            }

            //processig default guarantees

            if (oaiModel.guarantees) {
                processGuarantees(oaiModel.guarantees, oaiModel.context.type == 'plans' ? '*' : null, governifyModel);
            }

            //processing plans

            if (oaiModel.plans) {

                for (var plan in oaiModel.plans) {

                    if (oaiModel.plans[plan].availability) {
                        governifyModel.terms.configurations['availability'].of.push(new configValue({
                            "plan": plan
                        }, oaiModel.plans[plan].availability, governifyModel));
                    }
                    if (oaiModel.plans[plan].configuration) {
                        for (var conf in oaiModel.plans[plan].configuration) {
                            if (governifyModel.terms.configurations[conf]) {
                                governifyModel.terms.configurations[conf].of.push(new configValue({
                                    "plan": plan
                                }, oaiModel.plans[plan].configuration[conf], governifyModel));
                            } else {
                                var of = [];
                                of.push(new configValue({
                                    plan: "*"
                                }, oaiModel.configuration[conf], governifyModel));
                                governifyModel.terms.configurations[conf] = new configuration(of, governifyModel.type);
                            }
                        }
                    }

                    if (oaiModel.plans[plan].pricing) {
                        governifyModel.terms.pricing.of.push(new pricingObject(
                            oaiModel.plans[plan].pricing.cost ? oaiModel.plans[plan].pricing.cost : oaiModel.pricing.cost,
                            oaiModel.plans[plan].pricing.currency ? oaiModel.plans[plan].pricing.currency : oaiModel.pricing.currency,
                            new billingObject(
                                oaiModel.plans[plan].pricing.billing ? oaiModel.plans[plan].pricing.billing : oaiModel.pricing.billing,
                                oaiModel.context.validity ? oaiModel.context.validity.effectiveDate : null), {
                                "plan": plan
                            }
                        ));
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
            governifyModelPrettify(governifyModel);
            //console.log(JSON.stringify(governifyModel, null, 2));

            console.log(governifyModel.terms);
            try {
                var ret = yaml.safeDump(governifyModel);
                return successCb(ret);
            } catch (e) {
                return errorCb(e.toString());
            }
        } catch (e) {
            return errorCb(e.message);
        }

    });

}


function processQuotas(quotas, plan, governifyModel) {

    for (var path in quotas) {
        for (var operation in quotas[path]) {
            for (var m in quotas[path][operation]) {

                if (!governifyModel.terms.metrics[m])
                    governifyModel.terms.metrics[m] = new metric(m, governifyModel);

                if (!governifyModel.terms.quotas['quotas_' + m])
                    governifyModel.terms.quotas['quotas_' + m] = new quota(m, governifyModel);

                for (var li in quotas[path][operation][m]) {
                    var name = createScope(plan, path, operation, quotas[path][operation][m][li].scope);

                    if (!governifyModel.terms.quotas['quotas_' + m].of[name]) {
                        governifyModel.terms.quotas['quotas_' + m].of[name] = {
                            scope: new scopeIntance(plan, path, operation, quotas[path][operation][m][li].scope),
                            limits: [
                                new limit(
                                    quotas[path][operation][m][li].max,
                                    quotas[path][operation][m][li].period ? quotas[path][operation][m][li].period : null)
                            ]
                        }
                    } else {
                        governifyModel.terms.quotas['quotas_' + m].of[name].limits.push(
                            new limit(quotas[path][operation][m][li].max, quotas[path][operation][m][li].period ? quotas[path][operation][m][li].period : null)
                        );
                    }

                }
            }
        }
    }
}

function processRates(rates, plan, governifyModel) {

    for (var path in rates) {
        for (var operation in rates[path]) {
            for (var m in rates[path][operation]) {

                if (!governifyModel.terms.metrics[m])
                    governifyModel.terms.metrics[m] = new metric(m, governifyModel);

                if (!governifyModel.terms.rates['rates_' + m])
                    governifyModel.terms.rates['rates_' + m] = new rate(m, governifyModel);

                for (var li in rates[path][operation][m]) {
                    var name = createScope(plan, path, operation, rates[path][operation][m][li].scope);

                    if (!governifyModel.terms.rates['rates_' + m].of[name]) {
                        governifyModel.terms.rates['rates_' + m].of[name] = {
                            scope: new scopeIntance(plan, path, operation, rates[path][operation][m][li].scope),
                            limits: [
                                new limit(rates[path][operation][m][li].max, rates[path][operation][m][li].period ? rates[path][operation][m][li].period : null)
                            ]
                        }
                    } else {
                        governifyModel.terms.rates['rates_' + m].of[name].limits.push(
                            new limit(rates[path][operation][m][li].max, rates[path][operation][m][li].period ? rates[path][operation][m][li].period : null)
                        );
                    }

                }
            }
        }
    }
}

function processGuarantees(guarantees, plan, governifyModel) {
    for (var path in guarantees) {
        for (var operation in guarantees[path]) {

            for (var o in guarantees[path][operation]) {

                //var m = guarantees[path][operation][o].objective.split(' ')[0];
                var oaiObjective = guarantees[path][operation][o].objective;
                var objectiveRegex = /(\w+)\s*(<=|==|>=|!=|<|>)\s*(\d+)/g;
                var matches = objectiveRegex.exec(oaiObjective);
                var m = matches[1];

                if (!governifyModel.terms.metrics[m])
                    governifyModel.terms.metrics[m] = new metric(m, governifyModel);

                if (!governifyModel.terms.guarantees['guarantees_' + m])
                    governifyModel.terms.guarantees['guarantees_' + m] = new guarantee(governifyModel);

                var name = createScope(plan, path, operation, guarantees[path][operation][o].scope);

                governifyModel.terms.guarantees['guarantees_' + m].of[name] = new objective(
                    guarantees[path][operation][o].objective,
                    guarantees[path][operation][o].window,
                    guarantees[path][operation][o].period,
                    new scopeIntance(plan, path, operation, guarantees[path][operation][o].scope)
                );
            }
        }
    }
}

function convertGovernify2OAI(governifyModel, successCb, errorCb) {
    successCb("convertGovernify2OAI");
}

function createScope(plan, path, operation, level) {
    if (plan != null) {
        return (plan ? plan : '*') + ',' +
            (path == 'global' ? '*' : path) + ',' +
            (operation == 'global' ? '*' : operation) + ',' +
            (level ? level : 'account');
    } else {
        return (path == 'global' ? '*' : path) + ',' +
            (operation == 'global' ? '*' : operation) + ',' +
            (level ? level : 'account');
    }

}

function scopeIntance(plan, path, operation, level) {
    var ret = null;
    if (plan != null) {
        ret = {
            "plan": plan ? plan : '*',
            "resource": path == 'global' ? '*' : path,
            "operation": operation == 'global' ? '*' : operation,
            "level": level ? level : 'account'
        };
    } else {
        ret = {
            "resource": path == 'global' ? '*' : path,
            "operation": operation == 'global' ? '*' : operation,
            "level": level ? level : 'account'
        };
    }
    if (ret.level == "account")
        ret.account = "*";
    else
        ret.account = {
            $ref: '#/context/consumer'
        };
    return ret;
}

function governifyModelPrettify(governifyModel) {
    for (var m in governifyModel.context.definitions.schemas) {
        delete governifyModel.context.definitions.schemas[m].resolution;
    }

    var quotas = [];
    for (var quota in governifyModel.terms.quotas) {
        governifyModel.terms.quotas[quota].id = quota;
        var newOf = [];
        for (var o in governifyModel.terms.quotas[quota].of) {
            newOf.push(governifyModel.terms.quotas[quota].of[o]);
        }
        governifyModel.terms.quotas[quota].of = newOf;
        quotas.push(governifyModel.terms.quotas[quota]);
    }

    var rates = [];
    for (var rate in governifyModel.terms.rates) {
        governifyModel.terms.rates[rate].id = rate;
        var newOf = [];
        for (var o in governifyModel.terms.rates[rate].of) {
            newOf.push(governifyModel.terms.rates[rate].of[o]);
        }
        governifyModel.terms.rates[rate].of = newOf;
        rates.push(governifyModel.terms.rates[rate]);
    }

    var guarantees = [];
    for (var guarantee in governifyModel.terms.guarantees) {
        governifyModel.terms.guarantees[guarantee].id = guarantee;
        var newOf = [];
        for (var o in governifyModel.terms.guarantees[guarantee].of) {
            newOf.push(governifyModel.terms.guarantees[guarantee].of[o]);
        }
        governifyModel.terms.guarantees[guarantee].of = newOf;
        guarantees.push(governifyModel.terms.guarantees[guarantee]);
    }

    //Prettify Pricing wating new model
    governifyModel.terms.pricing = governifyModel.terms.pricing.of[0];


    governifyModel.terms.quotas = quotas;
    governifyModel.terms.rates = rates;
    governifyModel.terms.guarantees = guarantees;
}
/** GOVERNIFY MODEL **/

function logs(url) {
    this.default = true;
    this.uri = url;
    this.scopes = {
        resource: "resource",
        method: "method",
        level: "level"
    }
}

function governify(id, version, type, context, terms, creationConstraints) {
    this.id = id;
    this.version = version;
    this.type = type;
    this.context = context;
    this.terms = terms;
    if (creationConstraints)
        this.creationConstraints = creationConstraints;
}

function context(provider, consumer, validity, infrastructure, definitions) {
    this.provider = provider;
    if (consumer)
        this.consumer = consumer;
    if (validity)
        this.validity = validity;
    this.infrastructure = infrastructure;
    this.definitions = definitions;
}

function validity(init, end) {
    this.initial = init;
    this.end = end;
}

function definitions(schemas, tenant) {
    this.schemas = schemas;
    this.scopes = oaiScopes(tenant);
}

function oaiScopes(tenant) {
    var ret = {
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
                type: 'string',
                enum: ['account', 'tenant']
            },
            account: {
                description: 'Account ID of current request',
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
    if (tenant)
        ret.oai.account.default = tenant;

    return ret;
}

function terms(pricing, configurations, metrics, quotas, rates, guarantees) {
    this.pricing = pricing;
    this.configurations = configurations;
    this.metrics = metrics;
    this.quotas = quotas;
    this.rates = rates;
    this.guarantees = guarantees;
}

function configuration(of, type) {
    if (type != 'agreement')
        this.scope = {
            plan: {
                '$ref': "#/context/definitions/scopes/offering/plan"
            }
        };
    this.of = of;
}

function configValue(scope, value, governifyModel) {
    if (governifyModel.type != 'agreement')
        this.scope = scope;
    this.value = value + '';
}

function pricing(type) {
    if (type != 'agreement')
        this.scope = {
            plan: {
                '$ref': "#/context/definitions/scopes/offering/plan"
            }
        };
    this.of = [];
}

function pricingObject(cost, currency, billing, scope) {
    if (scope)
        this.scope = scope;
    this.cost = cost;
    this.currency = currency;
    this.billing = billing;
}

function billingObject(period, init) {
    this.period = period;
    if (init)
        this.initial = init;
}

function quota(metric, governifyModel) {
    this.id = null;
    if (governifyModel.type != 'agreement') {
        this.scope = {
            plan: {
                $ref: "#/context/definitions/scopes/offering/plan"
            },
            resource: {
                $ref: "#/context/definitions/scopes/api/resource"
            },
            operation: {
                $ref: "#/context/definitions/scopes/api/operation"
            },
            level: {
                $ref: "#/context/definitions/scopes/oai/level"
            },
            account: {
                $ref: "#/context/definitions/scopes/oai/account"
            }
        };
    } else {
        this.scope = {
            resource: {
                $ref: "#/context/definitions/scopes/api/resource"
            },
            operation: {
                $ref: "#/context/definitions/scopes/api/operation"
            },
            level: {
                $ref: "#/context/definitions/scopes/oai/level"
            },
            account: {
                $ref: "#/context/definitions/scopes/oai/account"
            }
        };
    }

    this.over = {};
    this.over[metric] = {
        $ref: "#/terms/metrics/" + metric
    };

    this.of = {};

}

function rate(metric, governifyModel) {
    this.id = null;
    if (governifyModel.type != 'agreement') {
        this.scope = {
            plan: {
                $ref: "#/context/definitions/scopes/offering/plan"
            },
            resource: {
                $ref: "#/context/definitions/scopes/api/resource"
            },
            operation: {
                $ref: "#/context/definitions/scopes/api/operation"
            },
            level: {
                $ref: "#/context/definitions/scopes/oai/level"
            },
            account: {
                $ref: "#/context/definitions/scopes/oai/account"
            }
        };
    } else {
        this.scope = {
            resource: {
                $ref: "#/context/definitions/scopes/api/resource"
            },
            operation: {
                $ref: "#/context/definitions/scopes/api/operation"
            },
            level: {
                $ref: "#/context/definitions/scopes/oai/level"
            },
            account: {
                $ref: "#/context/definitions/scopes/oai/account"
            }
        };
    }

    this.over = {};
    this.over[metric] = {
        $ref: "#/terms/metrics/" + metric
    };

    this.of = {};
}

function guarantee(governifyModel) {
    this.id = null;
    if (governifyModel.type != 'agreement') {
        this.scope = {
            plan: {
                $ref: "#/context/definitions/scopes/offering/plan"
            },
            resource: {
                $ref: "#/context/definitions/scopes/api/resource"
            },
            operation: {
                $ref: "#/context/definitions/scopes/api/operation"
            },
            level: {
                $ref: "#/context/definitions/scopes/oai/level"
            },
            account: {
                $ref: "#/context/definitions/scopes/oai/account"
            }
        };
    } else {
        this.scope = {
            resource: {
                $ref: "#/context/definitions/scopes/api/resource"
            },
            operation: {
                $ref: "#/context/definitions/scopes/api/operation"
            },
            level: {
                $ref: "#/context/definitions/scopes/oai/level"
            },
            account: {
                $ref: "#/context/definitions/scopes/oai/account"
            }
        };
    }

    this.of = {};
}

function objective(objective, window, period, scope) {
    this.scope = scope;
    this.objective = objective;
    this.window = {
        type: window,
        period: period
    }
}

function limit(max, period) {
    this.max = max;
    if (period)
        this.period = period;
}

function metric(metric, governifyModel) {
    this.schema = {
        $ref: "#/context/definitions/schemas/" + metric
    }
    this.type = governifyModel.context.definitions.schemas[metric].resolution;
    this.scope = {
        resource: {
            $ref: "#/context/definitions/scopes/api/resource"
        },
        operation: {
            $ref: "#/context/definitions/scopes/api/operation"
        },
        level: {
            $ref: "#/context/definitions/scopes/oai/level"
        },
        account: {
            $ref: "#/context/definitions/scopes/oai/account"
        }
    };
}

function creationConstraints(constraint, qualifyCondition) {
    this.constraint = constraint;
    if (qualifyCondition)
        this.qualifyCondition = qualifyCondition;
}

function constraint(of) {
    this.over = {
        $ref: "#/context/definitions/scopes/offering/plan"
    };
    this.of = of;
}
