const TuyAPI = require('tuyapi');

module.exports = function() {
    this.LIGHT_STRIP_ON = "your_url_here";
    this.LIGHT_STRIP_OFF = "your_url_here";

    this.device = new TuyAPI({
      ip: '1.1.1.1',
      id: 'alphanumeric',
      key: 'alphanumeric'});
}
