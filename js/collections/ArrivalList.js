		module.exports = Backbone.Collection.extend({
		model: Arrival,   //changed Arrival to app.Arrival

		comparator: function(arrival) {
		    return arrival.minutesFromNow();
        },

		url: function() {
			return API_URL + 'stop_times/' + this.stopId + '/';
		}
	});
