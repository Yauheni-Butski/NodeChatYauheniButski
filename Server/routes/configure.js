var routes = require('./index');

module.exports = function(app) {
    app.use('/',routes);
}
