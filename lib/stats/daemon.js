
module.exports = function refreshVersions(metrics, client) {
  client.version(function(err, data) {
    if (err) {
      console.error('failed to retrieve versions', err);
      return;
    }

    metrics.version.set(data.Version);
    metrics.apiVersion.set(data.ApiVersion);
  });
};
