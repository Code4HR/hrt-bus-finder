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
			return API_URL + 'stop_times/' + this.stopId;
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
	
	var BusList = Backbone.Collection.extend({
	    initialize: function(models, options) {
	        this.routeIds = options.routeIds;
	    },
	    
		url: function() {
		    var url = API_URL + 'buses/routes';
		    if(this.routeIds) {
		        url += '/' + this.routeIds;
	        }
			return url;
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
		}
	});
	
	var StopView = Backbone.View.extend({
		template: _.template($('#stop-template').html()),
		
		initialize: function() {
			this.collection = new ArrivalList;
			this.collection.stopId = this.model.get('stopId');
			this.collection.on('add', this.addArrival, this);
			this.collection.on('sync', this.checkForEmpty, this);
			
			this.updateArrivalList();
			App.Intervals.push(setInterval($.proxy(this.updateArrivalList, this), 20000));
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
		}
	});
	
	var MapView = Backbone.View.extend({
		initialize: function() {
			this.map = new google.maps.Map(this.$el[0], {disableDefaultUI: true});
			this.markers = [];
			this.busMarkers = {};
			this.oldBusMarkers = {};
		},
	    
	    clear: function() {
	        while(this.markers.length) {
	            this.markers.pop().setMap(null);
            }
            this.oldBusMarkers = this.busMarkers;
            this.busMarkers = {};
            $.each(this.oldBusMarkers, function(key, value) {
                value.setMap(null);
            });
	    },
	    
	    createUserMarker: function(location) {
	        var userMarker = new google.maps.Marker({
				position: location,
				map: this.map
			});
			this.markers.push(userMarker);
	    },
	    
	    createStopMarker: function(stop) {
	        var stopPosition = new google.maps.LatLng(stop.get('location')[1], stop.get('location')[0]);
			var stopMarker = new google.maps.Marker({
				position: stopPosition,
				map: this.map,
				icon: './img/busstop.png'
			});
			this.markers.push(stopMarker);
	    },
	    
	    createBusMarker: function(bus) {
	        var location = bus.get('busPosition') || bus.get('location');
	        var direction = bus.get('direction_id') || bus.get('direction');
	        if(location) {
    			var position = new google.maps.LatLng(location[1], location[0]);
    			var directionStr = direction ? 'inbound' : 'outbound';
    			var icon = './img/bus-' + directionStr + '.png';
    			var busMarker = new google.maps.Marker({
    				position: position,
    				icon: icon
    			});
    			
    			if(bus.get('busId') in this.oldBusMarkers){
    			    this.moveMarker(this.oldBusMarkers[bus.get('busId')], busMarker);
			    } else {
			        busMarker.setMap(this.map);
			    }
    			this.busMarkers[bus.get('busId')] = busMarker;
			}
	    },
	    
	    moveMarker: function(oldMarker, newMarker) {
	        var frames = 50;
	        var start = oldMarker.getPosition();
	        var destination = newMarker.getPosition();
	        
	        if(start.lat() == destination.lat() && start.lng() == destination.lng()) {
	            newMarker.setMap(this.map);
	            return;
	        }
	        
	        var latStep = (destination.lat() - start.lat()) / frames;
	        var lngStep = (destination.lng() - start.lng()) / frames;
	        
	        newMarker.setPosition(start);
	        newMarker.setMap(this.map);
	        
	        move = function(frame, marker, latS, lngS, dest) {
	            var curPos = marker.getPosition();
	            var newPos = new google.maps.LatLng(curPos.lat() + latS, curPos.lng() + lngS);
	            marker.setPosition(newPos);
	            if(frame < frames) {
	                setTimeout(function(){move(frame + 1, marker, latS, lngS, dest);}, 100);
	            } else {
	                marker.setPosition(dest);
	            }
	        }
	        
	        move(1, newMarker, latStep, lngStep, destination);
	    },
	    
	    setBounds: function() {
	        var bounds = new google.maps.LatLngBounds();
			for(var i=0; i<this.markers.length; i++) {
			    bounds.extend(this.markers[i].getPosition());
			}
			$.each(this.busMarkers, function(key, value) {
                bounds.extend(value.getPosition());
            });
			this.map.fitBounds(bounds);
	    },
	    
	    center: function(location) {
	        this.map.setCenter(location);
	    },
	    
	    resize: function() {
			google.maps.event.trigger(this.map, 'resize');
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
			App.Intervals.push(setInterval($.proxy(this.updateTime, this), 20000));
		},
		
		updateTime: function() {
		    this.$('.timeframe').html(this.model.minutesFromNow());
		    this.$('.lastUpdate').html(this.model.lastCheckinTimeDescription());
		},
		
		render: function() {
		    var mapShowing = this.$('.mapcanvas').is(':visible');
		    
			this.$el.html(this.template({
				routeId: this.model.get('route_id'),
				destination: this.model.get('destination'),
				arriveTime: this.model.localTime(),
				adherence: this.model.adherenceDescription(),
				arriveMinutes: this.model.minutesFromNow(),
				busId: this.model.get('busId'),
				lastUpdate: this.model.lastCheckinTimeDescription()
			}));
			
			if(mapShowing) {
			    this.showMap(null);
			}
		    
			return this;
		},
		
		showMap: function(scroll) {
		    var mapShowing = this.$('.mapcanvas').is(':visible');
		    
			$('.extended-info').hide();
			$('.mapcanvas').hide();
			$('.arrow > img').attr('src', './img/arrow-down.png');
				
			if(!mapShowing) {
				var mapHeight = window.innerHeight - 220; //map height is height of screen less the height of about bar .schedule
				App.MapView.clear();
				App.MapView.createStopMarker(this.options.stop);
    			App.MapView.createBusMarker(this.model);
    			App.MapView.$el.height(mapHeight);
    			this.$('.mapcanvas').html(App.MapView.el);
				
				this.$('.arrow > img').attr('src', './img/arrow-up.png');
			    this.$('.extended-info').show();
				this.$('.mapcanvas').show();
				App.MapView.resize();
				App.MapView.setBounds();
				
				if(scroll) {
				    $('html,body').animate({scrollTop: this.$el.offset().top - 50 }, 'slow');
			    }
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
	
	var RouteView = Backbone.View.extend({
	    className: 'mapcanvas',
	    
	    initialize: function() {
	        this.firstUpdate = true;
			this.collection.on('reset', this.addBuses, this);
			this.updateBuses();
			App.Intervals.push(setInterval($.proxy(this.updateBuses, this), 20000));
		},
		
		render: function() {
		    App.MapView.$el.height(window.innerHeight - 220);
			this.$el.html(App.MapView.el);
			this.$el.show();
			App.MapView.resize();
			return this;
		},
		
		addBuses: function() {
			App.MapView.clear();
			App.MapView.createUserMarker(DowntownNorfolk);
			this.collection.each(function(bus){
			    App.MapView.createBusMarker(bus);
			});
			App.MapView.resize();
			if(this.firstUpdate){
			    App.MapView.setBounds();
			    this.firstUpdate = false;
		    }
	    },
		
		updateBuses: function() {
			this.collection.fetch({reset: true, dataType: 'jsonp'});
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
			"": "homeView",
			"stops/*stopIds": "stopView",
			"routes/*routeIds": "routeView"
		 },
		
		homeView: function() {
		    this.clearIntervals();
			App.ContentView.setSubView(new HomeView);
		},
		
		stopView: function(stopIds) {
		    this.clearIntervals();
		    App.ContentView.setSubView(new StopsByIdView({stopIds: stopIds}));
		},
		
		routeView: function(routeIds) {
		    this.clearIntervals();
		    App.ContentView.setSubView(new RouteView({
		        routeIds: routeIds,
		        collection: new BusList({}, {routeIds: routeIds})
		    }));
		},
		
		clearIntervals: function() {
		    while(App.Intervals.length) {
		        clearInterval(App.Intervals.pop());
		    }
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
		Router: new Router,
		MapView: new MapView,
		Intervals: []
	};
	var root = document.URL.indexOf('/hrt-bus-finder') == -1 ? '/' : '/hrt-bus-finder/';
	Backbone.history.start({ root: root });
});
