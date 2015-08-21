var pmx    = require('pmx');
var async  = require('async');
var Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'});

// Init module
var conf   = pmx.initModule({

  pid              : pmx.resolvePidPaths(['/var/run/docker.pid']),

  widget : {
    type             : 'docker',
    logo             : 'https://camo.githubusercontent.com/3482fc32e1f4cad0c44039c8f01e1e270e6894ee/687474703a2f2f692e696d6775722e636f6d2f4b6764574c64682e706e67',

    // 0 = main element
    // 1 = secondary
    // 2 = main border
    // 3 = secondary border
    theme            : ['#22B8EB', '#134A6A', 'white', 'white'],

    el : {
      probes  : false,
      actions : false
    },

    block : {
      actions : false,
      issues  : true,
      meta    : false
    }

    // Status
    // Green / Yellow / Red
  }
});


// Globals
var WORKER_INTERVAL  = 1000;
var probe            = pmx.probe();
var gl_containers    = [];
var gl_streams       = [];

// Metrics formating
function calculateCPUPercent(statItem, previousCpu, previousSystem) {
  var cpuDelta = statItem.cpu_stats.cpu_usage.total_usage - previousCpu;
  var systemDelta = statItem.cpu_stats.system_cpu_usage - previousSystem;

  var cpuPercent = 0.0;
  if (systemDelta > 0.0 && cpuDelta > 0.0) {
    cpuPercent = (cpuDelta / systemDelta) * statItem.cpu_stats.cpu_usage.percpu_usage.length * 100.0;
  }
  return cpuPercent;
}

function calcCPU(stats, data) {
  var percent = calculateCPUPercent(stats, data.previousCpu, data.previousSystem);
  data.previousCpu = stats.cpu_stats.cpu_usage.total_usage;
  data.previousSystem = stats.cpu_stats.system_cpu_usage;
  return percent.toFixed(2) + '%';
}

function calcMemory(stats) {
  return (stats.memory_stats.usage / (1024*1024)).toFixed(2) + 'MB/'
	  + (stats.memory_stats.limit / (1024*1024)).toFixed(2) + 'MB';
}

function calcNetworkDown(stats, data) {
  var current = stats.network.rx_bytes - data.previousDownload;
  data.previousDownload = stats.network.rx_bytes;

  return (current / (1024*1024)).toFixed(3) + 'MB/s';
}

function calcNetworkUp(stats, data) {
  var current = stats.network.tx_bytes - data.previousUpload;
  data.previousUpload = stats.network.tx_bytes;

  return (current / (1024*1024)).toFixed(3) + 'MB/s';
}

// Utilities
function containerExists(container) {
  var ret = false;

  gl_containers.some(function(elem) {
    if (elem.Id === container.Id) {
      ret = true;
      return true;
    }
    return false;
  });

  return ret;
}

function addContainer(container) {
  docker.getContainer(container.Id).wait(function() {
    removeContainer(container);
    console.log('Container "' + container.Names[0] + '" exited.');
  });

  container.private = {
    previousCpu      : 0,
    previousSystem   : 0,
    previousUpload   : 0,
    previousDownload : 0
  };

	docker.getContainer(container.Id).stats(function(err, stream) {
		if (err) return console.error(err.stack || err);

    stream.on('data', function (data) {
      data = JSON.parse(data.toString());
		  container.Cpu = calcCPU(data, container.private);
		  container.Memory = calcMemory(data);
      container.NetworkDownstream = calcNetworkDown(data, container.private);
      container.NetworkUpstream = calcNetworkUp(data, container.private);
      //console.log(container);
		});

    gl_containers.push(container);
    gl_streams.push(stream);
    console.log('Container "' + container.Names[0] + '" started.');
	});
}

function removeContainer(container) {
  var index = -1;

  gl_containers.some(function(elem, i) {
    if (elem.Id === container.Id) {
      index = i;
      return true;
    }
    return false;
  });

  if (index !== -1) {
    gl_containers.splice(index, 1);
    gl_streams[index].removeAllListeners('data');
    gl_streams[index] = null;
    gl_streams.splice(index, 1);
  }
}

// Worker
function listContainers() {
  // global.gc();
  // console.log((process.memoryUsage().rss / (1024*1024)).toFixed(2) + 'MB');

  docker.listContainers(function(err, containers) {
	  if (err) {
      console.error(err.stack || err);
      setTimeout(listContainers, WORKER_INTERVAL);
      return;
    }

	  async.each(containers, function(container, next) {
      if (containerExists(container) === false) {
        addContainer(container);
      }
      next();
	  }, function() {
      setTimeout(listContainers, WORKER_INTERVAL);
    });
  });
}
listContainers();

// Metrics
probe.transpose('containers', function() {
  var ret = JSON.parse(JSON.stringify(gl_containers));

  ret.forEach(function(elem) {
    if (elem.private)
      delete elem.private;
  });

  // console.log(require('util').inspect(ret, true, null, false));

  return ret;
});

// Remote actions
pmx.scopedAction('restart', function(opts, res) {
  res.send('Restarting container...');
  docker.getContainer(opts.Id).restart(function(err, data) {
    if (err) return res.error(err);
    res.end('Container ' + opts.Image + ' restarted');
  });
});

pmx.action('restart all', function(reply) {
  async.forEach(gl_containers, function(container, next) {
    docker.getContainer(container.Id).restart(function(err, data) {
      return next();
    });
  }, function() {
    return reply({success:true});
  });
});
