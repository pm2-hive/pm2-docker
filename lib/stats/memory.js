
module.exports = function refreshMemory(metrics, stats) {
  metrics.memUsage.set(
    (stats.usage / (1024 * 1024)).toFixed(2) + 'MB/' + (
      stats.limit / (1024 * 1024)).toFixed(2) + 'MB');
};
