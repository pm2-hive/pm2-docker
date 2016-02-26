
module.exports = function refreshCpu(metrics, stats, state) {
  var cpuDelta = stats.cpu_usage.total_usage - state.get('previousCpu');
  var systemDelta = stats.system_cpu_usage - state.get('previousSystem');

  var cpuPercent = 0.0;
  if (systemDelta > 0.0 && cpuDelta > 0.0) {
    cpuPercent = (cpuDelta / systemDelta) * stats.cpu_usage.percpu_usage.length * 100.0;
  }

  state.set('previousCpu', stats.cpu_usage.total_usage);
  state.set('previousSystem', stats.system_cpu_usage);
  metrics.cpuUsage.set(cpuPercent.toFixed(2) + '%');

};
