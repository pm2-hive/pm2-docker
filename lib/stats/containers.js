var Probe = require('pmx').probe();
var refreshCpu = require('cpu');
var refreshMemory = require('memory');
var refreshNetwork = require('network');


var state = {};
var metrics = {};

function initMetrics(id, name, status) {

  if (metrics[id]) {
    metrics[id].status.set(status);
    return;
  }

  metrics[id] = {};

  metrics[id].name = Probe.metric({
    name: 'Container Name',
    value: 'N/A'
  });

  metrics[id].name.set(name);

  metrics[id].status = Probe.metric({
    name: 'Container Status',
    value: 'N/A'
  });

  metrics[id].status.set(status);

  metrics[id].cpuUsage = Probe.metric({
    name: 'Container CPU Usage',
    value: 'N/A'
  });

  metrics[id].memUsage = Probe.metric({
    name: 'Container Memory Usage',
    value: 'N/A'
  });

  metrics[id].networks = {};

  state[id] = {
    stream: null,
    previousCpu: 0,
    previousSystem: 0,
    get: function (key) {
      return this[key];
    },
    set: function (key, value) {
      this[key] = value;
    },
    net: {}
  };

}

function initNetworkMetrics(id, name) {

  if (metrics[id].networks[name]) {
    return;
  }

  metrics[id].networks[name] = {};

  metrics[id].networks[name]['input'] = Probe.metric({
    name: 'Container Network ' + name + ' input',
    value: 'N/A'
  });

  metrics[id].networks[name]['output'] = Probe.metric({
    name: 'Container Network ' + name + ' output',
    value: 'N/A'
  });

  state[id].net[name] = {
    previousDownload: 0,
    previousUpload: 0,
    get: function (key) {
      return this[key];
    },
    set: function (key, value) {
      this[key] = value;
    }
  };

}

function refreshNetworks(id, stats) {

  function _refresh(netstats, netname) {
    initNetworkMetrics(id, netname);
    refreshNetwork(metrics[id].networks[netname], netstats, state[id].net[netname]);
  }

  // only works for version pre v1.21
  // now it is networks with sub components based on interfaces
  // to handle both, if network then assume interface is eth0
  if (stats.network) {
    _refresh(stats.network, 'eth0');
    return;
  }

  Object.keys(stats.networks).forEach(function (name) {
    _refresh(stats.networks[name], name);
  });

}

function refreshMetrics(id, data) {
  var stats = JSON.parse(data.toString());

  refreshCpu(metrics[id], stats.cpu_stats, state[id]);
  refreshMemory(metrics[id], stats.memory_stats);
  refreshNetworks(id, stats);
}

function addContainer(container) {

  container.self.wait(function () {
    state[container.id].stream.removeAllListeners('data');
    delete state[container.id];
    console.log('Container ' + container.name + ' exited.');
  });

  container.self.stats(function (err, stream) {
    if (err) {
      return console.error(err.stack || err);
    }

    // requires a min API version of 1.17 for Docker 1.5.x
    stream.on('data', function (data) {
      refreshMetrics(container.id, data);
    });

    state[container.id].stream = stream;
    console.log('Container ' + container.name + ' started.');
  });
}

module.exports = function refreshContainersStats(client) {

  client.listContainers(function (err, containers) {
    if (err) {
      console.error(err.stack || err);
      return;
    }

    async.each(containers, function (container, next) {
      initMetrics(container.Id, container.Names[0], container.Status);

      if (!state[container.Id].stream) {
        addContainer({
          self: client.getContainer(container.Id),
          id: container.Id,
          name: container.Names[0]
        });
      }

      next();
    });

  });

};
