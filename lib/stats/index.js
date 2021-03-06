var Probe = require('pmx').probe();
var setDaemonState = require('./daemon');
var refreshContainers = require('./containers');

var metrics = {};

function initMetrics() {

  metrics.version = Probe.metric({
    name: 'Docker Version',
    value: 'N/A',
    agg_type: 'none'
  });

  metrics.apiVersion = Probe.metric({
    name: 'Docker API Version',
    value: 'N/A',
    agg_type: 'none'
  });

}

function setState(client) {
  setDaemonState(metrics, client);
}

function refreshMetrics(client) {
  refreshContainers(client);
}

module.exports.init = function init(client, refresh_rate) {
  refresh_rate = refresh_rate || 5000; // ms
  initMetrics();
  setState(client);

  setInterval(refreshMetrics.bind(this, client), refresh_rate);
  refreshMetrics(client);

};
