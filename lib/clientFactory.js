var Docker = require('dockerode');

module.exports.build = function build(conf) {
  var opts = {};

  if (process.env.PM2_DOCKER_SOCKET_PATH || conf.socketPath) {
    opts.socketPath = process.env.PM2_DOCKER_SOCKET_PATH || conf.socketPath;
  }
  if (process.env.PM2_DOCKER_HOST || conf.host) {
    opts.host = process.env.PM2_DOCKER_HOST || conf.host;
    opts.port = process.env.PM2_DOCKER_PORT || conf.port;
    opts.protocol = process.env.PM2_DOCKER_PROTOCOL || conf.protocol;
  }
  if (process.env.PM2_DOCKER_VERSION || conf.version) {
    opts.version = process.env.PM2_DOCKER_VERSION || conf.version;
  }
  return new Docker(opts);
};
