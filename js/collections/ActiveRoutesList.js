var API_URL = require('../utilities/apiUrl');

module.exports = Backbone.Collection.extend({
		url: API_URL + 'routes/active/'
	});
