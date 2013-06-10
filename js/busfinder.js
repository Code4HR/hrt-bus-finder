$(function(){
	var Arrival = Backbone.Model.extend({
		date: function() {
			return new Date(Date.parseUtc(this.get('arrival_time')));
		},
		
		localTime: function() {
			return this.date().to12HourString();
		},
		
		minutesFromNow: function() {
			var arriveTime = this.date();
			if(this.get('busAdherence')) {
				arriveTime = arriveTime.addMinutes(this.get('busAdherence') * -1);
			}
			
			var arriveTimeFromNow = new Date(arriveTime - new Date().getTime());
			return (arriveTimeFromNow.getTime() / 1000 / 60 | 0) + 1;
		},
		
		adherenceDescription: function() {
			var adherence = this.get('busAdherence');
			var description = 'on time';
			
			if(adherence && adherence < 0) {
				description = (adherence * -1) + ' min delay';
			} else if(adherence && adherence > 0) {
				description = adherence + ' min early';
			} else if(!adherence) {
				description = 'adherence unknown';
			}
			
			return description;
		}
	});
	
	var ArrivalList = Backbone.Collection.extend({ 
		model: Arrival,
		
		url: function() {
			return 'http://go.hrtb.us/api/stop_times/' + this.stopId + '/';
		}
	});
	
	var StopList = Backbone.Collection.extend({ 
		url: function() {
			return 'http://go.hrtb.us/api/stops/near/' + this.location.lat() + '/' + this.location.lng() + '/';
		}
	});
	
	var StopListView = Backbone.View.extend({
		initialize: function() {
			this.collection.on('reset', this.render, this);
			this.collection.fetch({reset: true, dataType: 'jsonp'});
		},
		
		render: function() {
			this.collection.each(this.addStop, this);
		},
		
		addStop: function(stop) {
			var stopView = new StopView({model: stop});
			this.$el.append(stopView.render().$el);
			console.log(stop);
		}
	});
	
	var StopView = Backbone.View.extend({
		template: _.template($('#stop-template').html()),
		
		initialize: function() {
			this.arrivalViews = [];
			
			this.collection = new ArrivalList;
			this.collection.stopId = this.model.get('stopId');
			this.collection.on('reset', this.addAllArrivals, this);
			
			this.updateArrivalList();
			setInterval($.proxy(this.updateArrivalList, this), 20000);
		},
		
		updateArrivalList: function() {
			this.collection.fetch({reset: true, dataType: 'jsonp'});
		},
		
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
		
		addAllArrivals: function() {
			while(this.arrivalViews.length) this.arrivalViews.pop().remove();
			
			if(this.collection.length) {
				this.collection.each(this.addArrival, this);
			} else {
				this.$('.arrivals')
				    .html($('<div/>', {
						class: 'no-arrivals', 
						text: 'No scheduled stops'
					}));
			}
		},
		
		addArrival: function(arrival) {
			var arrivalView = new ArrivalView({model: arrival});
			this.$('.arrivals .table').append(arrivalView.render().$el);
			this.arrivalViews.push(arrivalView);
		}
	});
	
	var ArrivalView = Backbone.View.extend({
		className: 'schedule row-fluid',
		
		template: _.template($('#arrival-template').html()),
		
		render: function() {
			this.$el.html(this.template({
				routeId: this.model.get('route_id'),
				destination: this.model.get('destination'),
				arriveTime: this.model.localTime(),
				adherence: this.model.adherenceDescription(),
				arriveMinutes: this.model.minutesFromNow()
			}));
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
	Date.prototype.to12HourString = function(m){
	    var dd = "AM";
		var hours = this.getHours();
		var mins = this.getMinutes();
		if (hours >= 12) {
			hours = hours - 12;
			dd = "PM";
		}
		if (hours == 0) {
			hours = 12;
		}
		
		mins = mins < 10 ? "0"+mins : mins;
		
		return hours + ":" + mins + " " + dd;
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