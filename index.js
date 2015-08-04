


var Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'});

var pmx   = require('pmx');
var async = require('async');
var MemoryStream = require('memorystream');

var conf  = pmx.initModule({

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

var gl_containers;

var previousCpu, previousSystem;

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
  return percent;
}

var pump = require('pump');
var split = require('split2');
var through2 = require('through2');

function listContainers() {
  docker.listContainers(function(err, containers) {

    async.each(containers, function(container, next) {
      docker.getContainer(container.Id).stats(function(err, stream) {
        var output = '';

        //return false;
        // pump(stream, split(JSON.parse), through2.obj(function(stats, enc, cb) {
        //   var percent = calculateCPUPercent(stats, previousCpu, previousSystem);

        //   this.push({
        //     v: 0,
        //     stats: stats
        //   });

        //   container.cpu  = Math.floor(percent * 100) / 100;
        //   previousCpu    = stats.cpu_stats.cpu_usage.total_usage;
        //   previousSystem = stats.cpu_stats.system_cpu_usage;
        //   cb();
        // }), function(err) {
        //   console.log('done');
        // });
        stream.on('data', function(data) {
          container.cpu = calcCPU(JSON.parse(data.toString()));
          console.log(stream);
          next();
        });

      });
    }, function(err) {
      console.log(containers);
      gl_containers = containers;
    });
  });
}

setInterval(listContainers, 2000);
listContainers();


probe.transpose('containers', function() { return gl_containers; });

/**
 * Metrics
 */



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
