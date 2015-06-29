


var Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'});

var pmx   = require('pmx');
var async = require('async');

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

function listContainers() {
  docker.listContainers(function(err, containers) {
    gl_containers = containers;

    // Do not work (Docker side..)
    // containers.forEach(function(container, index) {
    //   docker.getContainer(container.Id).stats(function(err, stream) {
    //     console.log(arguments);
    //   });
    // });
  });
}

setInterval(listContainers, 2000);
listContainers();

probe.transpose('containers', function() { return gl_containers; });

/**
 * Action section
 */

// Restart a container Id
pmx.action('restart', function(opts, reply) {
  docker.getContainer(opts.Id).restart(function(err, data) {
    return reply({success:true});
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
