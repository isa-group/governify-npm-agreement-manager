'use strict';

var iso8601 = require('iso8601');

module.exports = {
    metrics: {
        save: _metricsSave,
        get: _metricsGet,
        current: _metricsCurrent
   },

    quotas: {
        save: _quotasSave,
        get: _quotasGet,
        current: _quotasCurrent
    },

    rates:{
        save: _ratesSave,
        get: _ratesGet,
        current: _ratesCurrent
    }
}

function metricState (metric, scope, schema, window){
    this.metric = metric;
    this.scope = scope;
    this.schema = schema;
    this.window = window;
    this.records = [];
}
//save functions
function _metricsSave (state, name, scope, window, value, logsState, evidences){
      var updated = false;
      for (var m in state.metrics){
          var metric = state.metrics[m];
          if( isMetrics(name, scope, window, metric)){
              save(metric.records, new recordMetrics(value, logsState, evidences));
              updated = true;
          }
      }
      if(!updated){
          var newMetric = new metricState(
              name,
              scope,
              {},
              window
          )
          save(newMetric.records, new recordMetrics(value, logsState, evidences));
          state.metrics.push(newMetric);
      }
}

function _quotasSave (state, name, scope, value){
      for (var m in state.quotas){
          var quota = state.quotas[m];
          if(isQuotas(name, scope, quota))
              save(quota.records, new recordQuotas(value));
      }
}

function _ratesSave (state, name, scope, value){
      for (var m in state.rates){
          var rate = state.rates[m];
          if(isRates(name, scope, rate))
              save(rate.records, new recordQuotas(value));
      }
}

//get functions
function _metricsGet (state, name, scope, window){
      for (var m in state.metrics){
          var metric = state.metrics[m];
          if(isMetrics(name, scope, window, metric))
              return get(metric);
      }
}

function _quotasGet (state, name, scope){
      for (var m in state.quotas){
          var quota = state.quotas[m];
          if(isQuotas(name, scope, quota))
              return get(quota);
      }
}

function _ratesGet (state, name, scope){
      for (var m in state.rates){
          var rate = state.rates[m];
          if(isRates(name, scope, rate))
              return get(rate);
      }
}

//current functions
function _metricsCurrent (state, name, scope, window){
      var returned = state.metrics.filter((element, index, array) => {
          return isMetrics(name, scope, window, element);
      });
      return current(returned[0]);
}

function _quotasCurrent (state, name, scope){
      for (var m in state.quotas){
          var quota = state.quotas[m];
          if(isQuotas(name, scope, quota))
              return current(quota);
      }
}

function _ratesCurrent (state, name, scope){
      for (var m in state.rates){
          var rate = state.rates[m];
          if(isRates(name, scope, rate))
              return current(rate);
      }
}

//scopes and window check
function isMetrics (name, scope, window, metric){
    if(!metric.metric) return false;
    var ret = true;
    if(metric.metric != name){
        ret = ret && false;
    }
    for (var s in scope){
        if( metric.scope[s] != scope[s] && scope[s] != "*" )
          ret = ret && false;
    }
    for (var w in window){
        if(metric.window[w] != window[w] && w == "type" && w == "period")
          ret = ret && false;
    }
    return ret;
}

function isQuotas (name, scope, quota){
    if(!quota.quota) return false;
    var ret = true;
    if(quota.quota != name){
        ret = ret && false;
    }
    for (var s in scope){
        if(quota.scope[s] != scope[s])
          ret = ret && false;
    }
    return ret;
}

function isRates (name, scope, rate){
    if(!rate.rate) return false;
    var ret = true;
    if(rate.rate != name){
        ret = ret && false;
    }
    for (var s in scope){
        if(rate.scope[s] != scope[s])
          ret = ret && false;
    }
    return ret;
}
function save (records, value){
    records.push(value);
}

function get (value){
    return value.records ? value.records: [];
}

function current (value){
    if(value) return value.records[value.records.length - 1];
    else return null;
}

function recordMetrics (value, logsState, evidences){
    this.value = value;
    this.time = iso8601.fromDate(new Date());
    if(logsState == 0 || logsState)
      this.logsState = logsState;
    if(evidences)
      this.evidences = evidences;
}
function recordQuotas(value){
    this.fulfilled = value;
    this.time = iso8601.fromDate(new Date());
}
