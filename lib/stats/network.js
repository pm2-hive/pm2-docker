
module.exports = function refreshNetwork(metrics, stats, state) {
  var input = stats.rx_bytes - state.get('previousDownload');
  var output = stats.tx_bytes - state.get('previousUpload');

  state.set('previousDownload', stats.rx_bytes);
  metrics.input.set((input / (1024 * 1024)).toFixed(3) + 'MB/s');

  state.set('previousUpload', stats.tx_bytes);
  metrics.output.set((output / (1024 * 1024)).toFixed(3) + 'MB/s');

};
