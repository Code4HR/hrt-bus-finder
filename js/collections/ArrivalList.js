var Backbone = require('backbone'),
		_ = require('underscore'),
		$ = require('jquery'),
		API_URL = require('./../utilities/apiUrl'),
		Arrival = require('./../models/Arrival');

module.exports = Backbone.Collection.extend({
		model: Arrival,

		comparator: function(arrival) {
		    return arrival.minutesFromNow();
        },

		url: function() {
			return API_URL() + 'stop_times/' + this.stopId + '/';
		}
	});
