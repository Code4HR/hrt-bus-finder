var Backbone = require('backbone');
var API_URL = require('./../utilities/apiUrl');

module.exports = Backbone.Collection.extend({
		url: function() {
		    if(this.location) {
		        return API_URL() + 'stops/near/' + this.location.lat() + '/' + this.location.lng() + '/';
		    }

		    if(this.stopIds){
		        return API_URL() + 'stops/id/' + this.stopIds + '/';
		    }
		}
	});
