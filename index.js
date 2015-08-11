var pmx    = require('pmx');
var async  = require('async');
var Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'});

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


/**
 * Data section
 */
var probe = pmx.probe();

var gl_containers = [];

var previousCpu = 0;
var previousSystem = 0;
var previousUpload = 0;
var previousDownload = 0;


function calculateCPUPercent(statItem, previousCpu, previousSystem) {
  var cpuDelta = statItem.cpu_stats.cpu_usage.total_usage - previousCpu;
  var systemDelta = statItem.cpu_stats.system_cpu_usage - previousSystem;

  var cpuPercent = 0.0;
  if (systemDelta > 0.0 && cpuDelta > 0.0) {
    cpuPercent = (cpuDelta / systemDelta) * statItem.cpu_stats.cpu_usage.percpu_usage.length * 100.0;
  }
  return cpuPercent;
}

function calcCPU(stats) {
  var percent = calculateCPUPercent(stats, previousCpu, previousSystem);
  previousCpu = stats.cpu_stats.cpu_usage.total_usage;
  previousSystem = stats.cpu_stats.system_cpu_usage;
  return percent.toFixed(2) + '%';
}

function calcMemory(stats) {
  return (stats.memory_stats.usage / (1024*1024)).toFixed(2) + 'MB/'
	  + (stats.memory_stats.limit / (1024*1024)).toFixed(2) + 'MB';
}

function calcNetworkDown(stats) {
  var current = stats.network.rx_bytes - previousDownload;
  previousDownload = stats.network.rx_bytes;

  return (current / (1024*1024)).toFixed(3) + 'MB/s';
}

function calcNetworkUp(stats) {
  var current = stats.network.tx_bytes - previousUpload;
  previousUpload = stats.network.tx_bytes;

  return (current / (1024*1024)).toFixed(3) + 'MB/s';
}

function listContainers() {
  docker.listContainers(function(err, containers) {
	  if (err) return;
	  async.each(containers, function(container, next) {
	    docker.getContainer(container.Id).stats(function(err, stream) {
		    if (err) next (err);
		    stream.once('data', function(data) {
          //        console.log(require('util').inspect(JSON.parse(data.toString()).network, true, null, false));

          data = JSON.parse(data.toString());
		      container.Cpu = calcCPU(data);
		      container.Memory = calcMemory(data);
          container.NetworkDownstream = calcNetworkDown(data);
          container.NetworkUpstream = calcNetworkUp(data);
		      next();
		    });
	    });
	  }, function(err) {
      if (err) return;
	    gl_containers = containers;
    });
  });
  console.log(gl_containers);
  setTimeout(listContainers, 1000);
}
listContainers();

/**
 * Metrics
 */

probe.transpose('containers', function() { return gl_containers; });

/**
 * Action section
 */

// Restart a container Id
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
      console.log(arguments);
      return next();
    });
  }, function() {
    return reply({success:true});
  });
});
