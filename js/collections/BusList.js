var API_URL = require('../utilities/apiUrl');

module.exports = Backbone.Collection.extend({
	    initialize: function(models, options) {
	        this.routeIds = options.routeIds;
	    },

		url: function() {
		    var url = API_URL + 'buses/routes';
		    if(this.routeIds) {
		        url += '/' + this.routeIds + '/';
	        }
			return url;
		}
});
