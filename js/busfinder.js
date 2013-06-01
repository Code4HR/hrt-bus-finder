$(function(){
	var ArrivalList = Backbone.Collection.extend({ 
		url: function() {
			return '/api/stop_times/' + this.stopId + '/';
		}
	});
	
	var StopList = Backbone.Collection.extend({ 
		url: function() {
			return '/api/stops/near/' + this.location.lat() + '/' + this.location.lng() + '/';
		}
	});
	
	var StopListView = Backbone.View.extend({
		initialize: function() {
			this.collection.on('reset', this.render, this);
			this.collection.fetch({reset: true});
		},
		
		render: function() {
			this.collection.each(this.addStop, this);
		},
		
		addStop: function(stop) {
			var stopView = new StopView({model: stop});
			this.$el.append(stopView.render().$el);
		}
	});
	
	var StopView = Backbone.View.extend({
		template: _.template($('#stop-template').html()),
		
		initialize: function() {
			this.collection = new ArrivalList;
			this.collection.stopId = this.model.get('stopId');
			this.collection.on('reset', this.addAllArrivals, this);
			this.collection.fetch({reset: true});
		},
		
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
		
		addAllArrivals: function() {
			if(this.collection.length) {
				this.collection.each(this.addArrival, this);
			} else {
				this.$('.arrivals').html('No scheduled stops');
			}
		},
		
		addArrival: function(arrival) {
			var arrivalView = new ArrivalView({model: arrival});
			this.$('.arrivals tbody').append(arrivalView.render().$el);
		}
	});
	
	var ArrivalView = Backbone.View.extend({
		tagName: 'tr',
		
		template: _.template($('#arrival-template').html()),
		
		initialize: function() {
			var date = new Date(Date.parseUtc(this.model.get('arrival_time')));
			//var adherence = this.model.get('adherence');
			//if(adherence) {
			//	date = date.addMinutes(adherence);
			//}
			
			var stopTimeMinutesFromNow = new Date(new Date().getTime() - date).getTime() / 1000 / 60 | 0;
			this.model.set('arriveMinutes', stopTimeMinutesFromNow);
		},
		
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		}
	});
	
	var AppView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this);
			
			navigator.geolocation ?
				navigator.geolocation.getCurrentPosition(this.geolocationSuccess, this.geolocationFail):
				this.getStopList(DowntownNorfolk);
		},
		
		geolocationSuccess: function(position) {
			this.getStopList(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
		},
		
		geolocationFail: function() {
			this.getStopList(DowntownNorfolk);
		},
		
		getStopList: function(location) {
			var stopList = new StopList;
			stopList.location = location;
			var stopsListView = new StopListView({el: '#stops', collection: stopList});
		}
	});
	
	// Fix JavaScript Modulo of negative numbers
	// http://javascript.about.com/od/problemsolving/a/modulobug.htm
	Number.prototype.mod = function(n) {
		return ((this%n)+n)%n;
	};
	
	// Create addHours function for Date object so we can
	// easily get from GMT to EST (probably need to find a library for this)
	Date.prototype.addHours = function(h){
	    this.setHours(this.getHours()+h);
	    return this;
	}
	Date.prototype.addMinutes = function(m){
	    this.setMinutes(this.getMinutes()+m);
	    return this;
	}
	Date.parseUtc = function(input){
	    var parts = input.match(/(\d+)/g);
		// new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
		return Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]); // months are 0-based
	}
	
	// parse a date in yyyy-mm-dd format
	function parseDate(input) {
	  var parts = input.match(/(\d+)/g);
	  // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
	  return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
	}
	
	var DowntownNorfolk = new google.maps.LatLng(36.863794,-76.285608);
	var App = new AppView;
});