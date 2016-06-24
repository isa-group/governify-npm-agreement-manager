'use strict';
var deref = require('json-schema-deref');

module.exports = {
    initializeState: _initializeState,
    recordsManager: require('./recordsManager/recordsManager.js')
}

function _initializeState (agModel, successCb, errorCb) {
    deref(agModel, (err, fullSchema)=>{
        if(err) return errorCb(err);
        try{
            agModel = fullSchema;

            var agState = new state(
                agModel.id,
                true,
                {},
              /*  new pricing(
                  agModel.terms.pricing.of[0].cost,
                  agModel.terms.pricing.of[0].billing.period,
                  agModel.terms.pricing.of[0].billing.penalties
                )*/ {}
            )

            for (var q in agModel.terms.quotas){
                var quota = agModel.terms.quotas[q];

                for(var s in quota.scope){
                    agState.scope[s] = '*';
                }
                var metric =  Object.keys(quota.over)[0];

                for(var of in quota.of){
                    var qscope = quota.of[of].scope;
                    var metricSchema = quota.over[metric];

                    var metricS = new metricState(
                                          metric,
                                          new scope(qscope),
                                          new schema (metricSchema),
                                          new window("static", quota.of[of].limits[0].period)
                                        );

                    agState.metrics.push(metricS);

                    var quotaS = new quotaState(
                                        quota.id,
                                        new scope(qscope),
                                        {},
                                        {},
                                        []
                                    );
                    agState.quotas.push(quotaS);
                }
            }

            for (var q in agModel.terms.rates){
                var rate = agModel.terms.rates[q];

                for(var s in rate.scope){
                    agState.scope[s] = '*';
                }
                var metric =  Object.keys(rate.over)[0];

                for(var of in rate.of){
                    var qscope = rate.of[of].scope;
                    var metricSchema = rate.over[metric];

                    var metricS = new metricState(
                                          metric,
                                          new scope(qscope),
                                          new schema (metricSchema),
                                          new window("static", rate.of[of].limits[0].period)
                                        );

                    agState.metrics.push(metricS);

                    var rateS = new rateState(
                                        rate.id,
                                        new scope(qscope),
                                        {},
                                        {},
                                        []
                                    );
                    agState.rates.push(rateS);
                }
            }/**
            for (var q in agModel.terms.guarantees){
                var guarantee = agModel.terms.guarantees[q];

                for(var s in guarantee.scope){
                    agState.scope[s] = '*';
                }
                for(var of in guarantee.of){
                    var qscope = guarantee.of[of].scope;
                    var metricSchema = guarantee.over[metric];

                    var metricS = new metricState(
                                          metric,
                                          new scope(qscope),
                                          new schema (metricSchema),
                                          new window("static", guarantee.of[of].limits[0].period)
                                        );

                    agState.metrics.push(metricS);

                    var rateS = new rateState(
                                        guarantee.id,
                                        new scope(qscope),
                                        {},
                                        {},
                                        []
                                    );
                    agState.rates.push(rateS);
                }
            }**/
            successCb(agState);
        }catch(err){
            errorCb(err);
        }
    });

}

function state(agreementId, fulfilled, scope, pricing){
    this.agreementId = agreementId;
    this.fulfilled = fulfilled;
    this.scope = scope;
    this.pricing = pricing;
    this.metrics = [];
    this.quotas = [];
    this.rates = [];
    this.guarantees = [];
}

function scope(qscope){
    for (var s in qscope){
        this[s]=qscope[s];
    }
}

function schema(qschema){
    for (var s in qschema.schema){
        if(s != "scope")
            this[s]=qschema.schema[s];
    }
}


function quotaState(quota, scope, logs, period, evidences){
    this.quota = quota;
    this.scope = scope;
    this.logs = logs;
    this.period = period;
    this.evidences = evidences;
    this.records = [];
}

function rateState(rate, scope, logs, period, evidences){
    this.rate = rate;
    this.scope = scope;
    this.logs = logs;
    this.period = period;
    this.evidences = evidences;
    this.records = [];
}

function metricState (metric, scope, schema, window){
    this.metric = metric;
    this.scope = scope;
    this.schema = schema;
    this.window = window;
    this.records = [];
}

function window(type, period){
    this.type = type;
    if(period)
      this.period = period;
}

function pricing (cost, period, penalties){
    if(cost)
        this.cost = cost;
    if(period)
        this.period = period;
    if(penalties)
        this.penalties = penalties;
}
