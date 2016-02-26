var pmx = require('pmx');
var clientFactory = require('./lib/clientFactory');
var stats = require('./lib/stats');
var actions = require('./lib/actions');

pmx.initModule({

  pid: pmx.resolvePidPaths(['/var/run/docker.pid']),

  widget: {
    type: 'generic',
    logo: 'https://raw.githubusercontent.com/docker/docker/master/docs/static_files/docker-logo-compressed.png',

    // 0 = main element
    // 1 = secondary
    // 2 = main border
    // 3 = secondary border
    theme: ['#22B8EB', '#134A6A', 'white', 'white'],

    el: {
      probes: true,
      actions: true
    },

    block: {
      actions: true,
      issues: true,
      meta: false,
      main_probes: [
        'Docker Version',
        'Docker API Version',
        'Container Name',
        'Container Status',
        'Container CPU Usage',
        'Container Memory Usage',
        'Container Network eth0 input',
        'Container Network eth0 output'
      ]
    }

    // Status
    // Green / Yellow / Red
  }
}, function (err, conf) {
  var refresh_rate = process.env.PM2_DOCKER_REFRESH_RATE || conf.refresh_rate;

  var client = clientFactory.build(conf);
  stats.init(client, refresh_rate);
  actions.init(client);
});
