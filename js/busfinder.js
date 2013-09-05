$(function(){
	var Arrival = Backbone.Model.extend({
		idAttribute: "_id",
		
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
			if(!this.has('busAdherence'))
		        return 'scheduled';
		    
		    var adherence = this.get('busAdherence');
		    if(adherence > 0) 
    		    return adherence + ' min early';
			if(adherence < 0)
				return (adherence * -1) + ' min late';
			return 'on time'
		},
		
		lastCheckinTimeDescription: function() {
		    if(!this.has('busCheckinTime'))
		        return '';
		    
		    var date = new Date(Date.parseUtc(this.get('busCheckinTime')));
			var timePassed = new Date(new Date().getTime() - date).getTime() / 1000 / 60 | 0;
			
			if (timePassed == 0)
			    return 'just now';
			else if (timePassed == 1)
			    return '1 minute ago';
			
			return timePassed + ' minutes ago';
		}
	});
	
	var API_URL = 'http://lit-inlet-3610.herokuapp.com/api/'
	var ArrivalList = Backbone.Collection.extend({ 
		model: Arrival,
		
		url: function() {
			return API_URL + 'stop_times/' + this.stopId + '/';
		}
	});
	
	var StopList = Backbone.Collection.extend({
		url: function() {
		    if(this.location) {
		        return API_URL + 'stops/near/' + this.location.lat() + '/' + this.location.lng(); 
		    }
		    
		    if(this.stopIds){
		        return API_URL + 'stops/id/' + this.stopIds;
		    }
		}
	});
	
	var StopListView = Backbone.View.extend({
		initialize: function() {
			this.collection.on('reset', this.render, this);
			this.collection.fetch({reset: true, dataType: 'jsonp'});
		},
		
		render: function() {
			$('#loading').remove();
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
			this.collection.on('add', this.addArrival, this);
			this.collection.on('sync', this.checkForEmpty, this);
			
			this.updateArrivalList();
			setInterval($.proxy(this.updateArrivalList, this), 20000);
		},
		
		updateArrivalList: function() {
			this.collection.fetch({dataType: 'jsonp'});
		},
		
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},
		
		checkForEmpty: function() {
			if(!this.collection.length) {
				this.$('.arrivals')
				    .html($('<div/>', {
						class: 'no-arrivals', 
						text: 'No scheduled stops'
					}));
			}
		},
		
		addArrival: function(arrival) {
			var arrivalView = new ArrivalView({model: arrival, stop: this.model});
			this.$('.arrivals .table').append(arrivalView.render().$el);
			this.arrivalViews.push(arrivalView);
		}
	});
	
	var ArrivalView = Backbone.View.extend({
		className: 'schedule row-fluid',
		
		template: _.template($('#arrival-template').html()),
		
		events: {
			'click .row-fluid': 'showMap',
			'click .arrow': 'showMap'
		},
		
		initialize: function() {
			this.model.on('change', this.render, this);
			this.model.on('remove', this.remove, this);
			setInterval($.proxy(this.updateTime, this), 20000)
		},
		
		updateTime: function() {
		    this.$('.timeframe').html(this.model.minutesFromNow());
		},
		
		render: function() {
		    this.mapPositions = []
		    
			this.$el.html(this.template({
				routeId: this.model.get('route_id'),
				destination: this.model.get('destination'),
				arriveTime: this.model.localTime(),
				adherence: this.model.adherenceDescription(),
				arriveMinutes: this.model.minutesFromNow(),
				busId: this.model.get('busId'),
				lastUpdate: this.model.lastCheckinTimeDescription()
			}));
			
			this.map = new google.maps.Map(this.$('.mapcanvas')[0], {
				zoom: 15,
				draggable: false,
				mapTypeControl: false,
				navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
				mapTypeId: google.maps.MapTypeId.ROADMAP
			});
			
			var stopPosition = new google.maps.LatLng(this.options.stop.get('location')[1], this.options.stop.get('location')[0]);
			this.mapPositions.push(stopPosition);
			
			this.stopMarker = new google.maps.Marker({
				position: stopPosition,
				map: this.map,
				animation: google.maps.Animation.DROP,
				icon: './img/busstop.png'
			});
			
			if(this.model.has('busPosition')) {
    			var busPosition = new google.maps.LatLng(this.model.get('busPosition')[1], this.model.get('busPosition')[0]);
    			this.mapPositions.push(busPosition);
    			
    			var directionStr = this.model.get('direction_id') ? 'inbound' : 'outbound';
    			var icon = './img/bus-' + directionStr + '.png';
			
    			this.busMarker = new google.maps.Marker({
    				position: busPosition,
    				map: this.map,
    				animation: google.maps.Animation.DROP,
    				title: 'Bus ' + this.model.get('busId'),
    				icon: icon
    			});
			}
			
			return this;
		},
		
		showMap: function() {
			if(this.$('.mapcanvas').is(':visible')) {
				this.$('.extended-info').hide();
				this.$('.mapcanvas').hide();
				this.$('.arrow > img').attr('src', './img/arrow-down.png');
			} else {
				var mapHeight = window.innerHeight - 220; //map height is height of screen less the height of about bar .schedule
				console.log(mapHeight);
			    this.$('.extended-info').show();
				this.$('.mapcanvas').height(mapHeight);
				this.$('.mapcanvas').show();
				google.maps.event.trigger(this.map, 'resize');
				
				this.bounds = new google.maps.LatLngBounds();
				for(var i=0; i<this.mapPositions.length; i++) {
				    this.bounds.extend(this.mapPositions[i]);
				}
				this.map.fitBounds(this.bounds);
				
				$('html,body').animate({scrollTop: this.$el.offset().top - 50 }, 'slow');
				this.$('.arrow > img').attr('src', './img/arrow-up.png');
			}
		}
	});
	
	var HomeView = Backbone.View.extend({
	    id: 'stops',
	    
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
			var stopsListView = new StopListView({el: this.el, collection: stopList});
		}
	});
	
	var StopsByIdView = Backbone.View.extend({
	    id: 'stops',
		
		initialize: function() {
			var stopList = new StopList;
			stopList.stopIds = this.options.stopIds;
			var stopsListView = new StopListView({el: this.el, collection: stopList});
		}
	});
	
	var ContentView = Backbone.View.extend({
		el: $(".app-container"),
		
		setSubView: function(subView) {
			this.subView && this.subView.remove();
			this.subView = subView;
			this.$el.html(this.subView.render().el);
			this.$el.trigger('create');
			this.trigger('contentChanged');
		}
	});
	
	var Router = Backbone.Router.extend({
		 routes: {
			"": "home",
			"stops/*stopIds": "stops"
		 },
		
		home: function() {
			App.ContentView.setSubView(new HomeView);
		},
		
		stops: function(stopIds) {
		    App.ContentView.setSubView(new StopsByIdView({stopIds: stopIds}));
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
	var App = {
		ContentView: new ContentView,
		Router: new Router
	};
	var root = document.URL.indexOf('/hrt-bus-finder') == -1 ? '/' : '/hrt-bus-finder/';
	Backbone.history.start({ root: root });
});
