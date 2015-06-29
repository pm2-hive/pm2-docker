
var Docker = require('dockerode');
var docker = new Docker({socketPath: '/var/run/docker.sock'});

var pmx = require('pmx');

var probe = pmx.probe();

var gl_containers;

setInterval(function() {
  docker.listContainers(function(err, containers) {
    gl_containers = containers;
  });
}, 5000);

probe.transpose('containers', function() { return gl_containers; });

//console.log(containers);
// containers.forEach(function(containerInfo) {

//   var container_obj = docker.getContainer(containerInfo.Id);
//   console.log(container_obj, containerInfo);
//   container_obj.top(function(err, dt) {
//     //console.log(dt.Processes);
//   });
// });

// docker.createContainer({Image: 'egut/pm2', Cmd: ['-v ', process.cwd() + ':/srv/app', '-p',  '8000:8000']}, function (err, container) {
//   console.log(arguments);
//   container.start(function (err, data) {
//     console.log(arguments);
//   });
// });

// docker.run('egut/pm2', ['-v',  process.cwd() + ':/srv/app', '-p', '8000:8000'], process.stdout, function(container, docker) {
//   console.log(arguments);
// });

// docker.listImages(function(err, images) {
//   console.log(images);
// });


// docker.pull('phusion/baseimage', function(err, stream) {
//   console.log(err);
//   docker.modem.followProgress(stream, onFinished, onProgress);

//   function onFinished(err, output) {
//     console.log(arguments);
//   }
//   function onProgress(event) {
//     console.log(arguments);
//   }
// });
