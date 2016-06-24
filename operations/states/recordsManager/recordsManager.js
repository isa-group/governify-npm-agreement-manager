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

//save functions
function _metricsSave (state, name, scope, window, value){
      for (var m in state.metrics){
          var metric = state.metrics[m];
          if(isMetrics(name, scope, window, metric))
              save(metric.records, new recordMetrics(value));
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
      for (var m in state.metrics){
          var metric = state.metrics[m];
          if(isMetrics(name, scope, window, metric))
              return current(metric);
      }
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
    var ret = true;
    if(metric.metric != name){
        ret = ret && false;
    }
    for (var s in scope){
        if(metric.scope[s] != scope[s])
          ret = ret && false;
    }
    for (var w in window){
        if(metric.window[w] != window[w])
          ret = ret && false;
    }
    return ret;
}

function isQuotas (name, scope, quota){
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
    return value.records[value.records.length - 1];
}

function recordMetrics (value){
    this.value = value;
    this.time = iso8601.fromDate(new Date());
}
function recordQuotas(value){
    this.fulfilled = value;
    this.time = iso8601.fromDate(new Date());
}
