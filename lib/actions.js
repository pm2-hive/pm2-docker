var pmx = require('pmx');
var async  = require('async');

module.exports.init = function init(client) {

  pmx.scopedAction('restart', function (opts, res) {
    res.send('Restarting container...');
    client.getContainer(opts.Id).restart(function (err, data) {
      if (err) {
        return res.error(err);
      }
      res.end('Container ' + opts.Image + ' restarted');
    });
  });

  pmx.action('restart all', function (reply) {
    async.forEach(gl_containers, function (container, next) {
      client.getContainer(container.Id).restart(function (err, data) {
        return next();
      });
    }, function () {
      return reply({
        success: true
      });
    });
  });

};
