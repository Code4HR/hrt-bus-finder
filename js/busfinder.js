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
			return (arriveTimeFromNow.getTime() / 1000 / 60 | 0);
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
	
	var Stop = Backbone.Model.extend({
		idAttribute: "_id"
	});
	
	var API_URL = 'http://lit-inlet-3610.herokuapp.com/api/'
	var ArrivalList = Backbone.Collection.extend({ 
		model: Arrival,
		
		comparator: function(arrival) {
		    return arrival.minutesFromNow();
        },
        
		url: function() {
			return API_URL + 'stop_times/' + this.stopId + '/';
		}
	});
	
	var StopList = Backbone.Collection.extend({
		url: function() {
		    if(this.location) {
		        return API_URL + 'stops/near/' + this.location.lat() + '/' + this.location.lng() + '/'; 
		    }
		    
		    if(this.stopIds){
		        return API_URL + 'stops/id/' + this.stopIds + '/';
		    }
		}
	});

	var feedback = Backbone.Model.extend({
		defaults: {
			name: '',
			emailAddress: '',
			message: ''
		},

		validate: function(attribs) {
			if(attribs.message === undefined) {
				return "A message was not included.";
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
		        url += '/' + this.routeIds + '/';
	        }
			return url;
		}
	});
	
	var ActiveRoutesList = Backbone.Collection.extend({
		url: API_URL + 'routes/active/'
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
			this.collection.on('sort', this.checkOrder, this);
			this.collection.on('sync', this.checkForEmpty, this);
			this.listenTo(App.ContentView, 'forceRefresh', this.updateArrivalList);
			
			this.updateArrivalList();
			App.Intervals.push(setInterval($.proxy(this.updateArrivalList, this), 60000));
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
                var noStopsDiv = $('<div/>', {text: 'No scheduled stops'});
                noStopsDiv.addClass('no-arrivals');
                this.$('.arrivals').html(noStopsDiv);
			}
		},
		
		checkOrder: function() {
		    var dom = this.$('.arrivals .table .schedule');
		    if(dom.length != this.collection.length) {
		        this.addAllArrivals();
		        return;
		    }
		    
		    for(var i=0; i<this.collection.length; i++) {
		        if($(dom[i]).attr('data-id') != this.collection.at(i).id) {
		            this.addAllArrivals();
    		        return;
		        }
		    }
		},
		
		addAllArrivals: function() {
		    this.$('.arrivals .table').empty();
		    this.collection.each(this.addArrival, this);
		},
		
		addArrival: function(arrival) {
			var arrivalView = new ArrivalView({model: arrival, stop: this.model});
			this.$('.arrivals .table').append(arrivalView.render().$el);
		}
	});
	
	var MapView = Backbone.View.extend({
		initialize: function() {
			this.map = new google.maps.Map(this.$el[0], {
			    disableDefaultUI: true,
			    styles: [
                    {
                        featureType: "poi",
                        stylers: [
                            { visibility: "off" }
                        ]
                    }
                ]
			});
			this.markers = [];
			this.busMarkers = {};
			this.oldBusMarkers = {};
			
			google.maps.event.addListener(this.map, 'dragstart', $.proxy(this.cancelCenterChanged, this));
			google.maps.event.addListener(this.map, 'dragend', $.proxy(this.readyCenterChanged, this));
		},
		
		setOnCenterChangedEvent: function(onCenterChanged) {
		    this.onCenterChanged = onCenterChanged;
		},
		
		readyCenterChanged: function() {
		    this.centerChangedTimeout = setTimeout($.proxy(this.centerChanged, this), 1000);
		},
		
		cancelCenterChanged: function() {
		    this.centerChangedTimeout && clearTimeout(this.centerChangedTimeout);
		},
		
		centerChanged: function() {
		    if(this.onCenterChanged) this.onCenterChanged(this.map.getCenter());
		},
	    
	    clear: function() {
	        this.setOnCenterChangedEvent(null);
	        
	        while(this.markers.length) {
	            this.markers.pop().setMap(null);
            }
            this.oldBusMarkers = this.busMarkers;
            this.busMarkers = {};
            $.each(this.oldBusMarkers, function(key, value) {
                value.setMap(null);
            });
	    },
	    
	    createUserMarker: function(location, animate) {
	        var userMarker = new google.maps.Marker({
				position: location,
				animation: animate && google.maps.Animation.DROP,
				map: this.map
			});
			this.markers.push(userMarker);
	    },
	    
	    createStopMarker: function(stop, animate, onClick) {
	        var stopPosition = new google.maps.LatLng(stop.get('location')[1], stop.get('location')[0]);
			var stopMarker = new google.maps.Marker({
				position: stopPosition,
				animation: animate && google.maps.Animation.DROP,
				map: this.map,
				icon: './img/busstop.png'
			});
			
			onClick && google.maps.event.addListener(stopMarker, 'click', onClick);
			
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
			    
			    if(bus.has('location')) {
			        var infoWindow = new google.maps.InfoWindow({ 
        				content: this.getInfoWindowMsg(bus) 
        			});
        			this.setupInfoWindow(busMarker, infoWindow);
			    }
			    
    			this.busMarkers[bus.get('busId')] = busMarker;
			}
	    },
	    
	    setupInfoWindow: function(marker, info) {
	        var map = this.map;
	        google.maps.event.addListener(marker, 'click', function() {
		        info.open(map, marker);
		    });
	    },
	    
	    getInfoWindowMsg: function(bus) {
			var msg = '';
			msg += 'Bus #' + bus.get('busId') + ' traveling ';
			msg += bus.get('direction') == 0 ? 'outbound' : 'inbound';
			
			var adherence = bus.get('adherence');
			if (adherence != null) msg += '<br>is ';
			if (adherence == null) msg += '<br>has no adherence'
			else if (adherence == 0) msg += 'on time';
			else if (adherence == 1) msg += '1 minute early';
			else if (adherence > 0) msg += adherence + ' minutes early';
			else if (adherence == -1) msg += '1 minute late';
			else msg += (adherence * -1) + ' minutes late';
			
			var date = new Date(Date.parseUtc(bus.get('time')));
			var timePassed = new Date(new Date().getTime() - date).getTime() / 1000 / 60 | 0;

			msg += '<br>as of ';
			if (timePassed == 0) msg += 'just now.';
			else if (timePassed == 1) msg += '1 minute ago.';
			else msg += timePassed + ' minutes ago.';

			return msg;
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
	        if(location) {
	            this.map.setCenter(location);
            } else {
                return this.map.getCenter();
            }
	    },
	    
	    resize: function() {
			google.maps.event.trigger(this.map, 'resize');
	    },
	    
	    zoom: function(zoom) {
	        this.map.setZoom(zoom);
	    },
	    
	    setDraggable: function(flag) {
	        this.map.setOptions({
	            draggable: flag, 
	            scrollwheel: flag,
	            disableDoubleClickZoom: !flag});
	    }
    });
	
	var ArrivalView = Backbone.View.extend({
		className: 'schedule row-fluid',
		
		template: _.template($('#arrival-template').html()),
		
		events: {
			'click .row-fluid': 'showMap',
			'click .arrow': 'showMap'
		},
		
		routeType: {
		    '0': 'light-rail',
		    '3': 'bus',
		    '4': 'ferry'
		},
		
		initialize: function() {
			this.model.on('change', this.render, this);
			this.model.on('remove', this.remove, this);
			$(window).resize($.proxy(this.resize, this));
			App.Intervals.push(setInterval($.proxy(this.updateTime, this), 10000));
		},
		
		updateTime: function() {
		    var minutesToArrival = this.model.minutesFromNow();
		    
		    this.$('.timeframe').html(this.minutesFromNowToString(minutesToArrival));
		    this.$('.lastUpdate').html(this.model.lastCheckinTimeDescription());
		    this.$('.timeframe').removeClass('departed imminent enroute');
		    
		    if(minutesToArrival < 0) {
		        this.$('.timeframe').addClass('departed');
		    } else if (minutesToArrival >= 0 && minutesToArrival <= 5) {
		    	this.$('.timeframe').addClass('imminent');
		    } else {
		    	this.$('.timeframe').addClass('enroute');
		    }
		},
		
		minutesFromNowToString: function(minutesFromNow) {
		    if(minutesFromNow == 0) return 'Now';
		    if(minutesFromNow < 0) return 'Gone';
		    return minutesFromNow;
		},
		
		render: function() {
		    var mapShowing = this.$('.mapcanvas').is(':visible');
		    var minutesToArrival = this.model.minutesFromNow();
		    
			this.$el.html(this.template({
				routeId: this.model.get('route_id'),
				destination: this.model.get('destination'),
				arriveTime: this.model.localTime(),
				adherence: this.model.adherenceDescription(),
				arriveMinutes: this.minutesFromNowToString(minutesToArrival),
				busId: this.model.get('busId'),
				lastUpdate: this.model.lastCheckinTimeDescription()
			}));
			
			this.updateTime();
			this.$el.attr('data-id', this.model.id);
			this.$el.addClass(this.routeType[this.model.get('routeType')] + '-route');
			
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
				App.MapView.clear();
				App.MapView.createStopMarker(this.options.stop);
    			App.MapView.createBusMarker(this.model);
    			this.resize(true);
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
		},
		
		resize: function(force) {
		    var mapShowing = this.$('.mapcanvas').is(':visible');
		    if(force || mapShowing) {
		        var scheduleHeight = $('.schedule').height();
				var	headerHeight = $('.navbar').height();
				var	stopHeight = $('.stop-name').height();
				var	headHeight = $('.head-label').height();
				var mapHeight = window.innerHeight - (headerHeight + scheduleHeight + stopHeight + headHeight + 6);
				App.MapView.$el.height(mapHeight);
				App.MapView.resize();
				App.MapView.setBounds();
	        }
		}
	});
	
	var LocateUser = function(onLocated) {
	    
	    var onFail = function() {
	        onLocated(DowntownNorfolk);
	        $('#geolocation-failed').prependTo('#stops').fadeIn();
	    };
	    
	    var timeout = setTimeout(onFail, 5000);
	    
	    var onSuccess = function(position) {
	        clearTimeout(timeout);
	        onLocated(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
	    };
        
	    navigator.geolocation ?
			navigator.geolocation.getCurrentPosition(onSuccess, onFail) : onFail();
	};
	
	var HomeView = Backbone.View.extend({
	    template: _.template($('#stop-list-template').html()),

	    events: {
		    'click .loadMore': 'forceRefresh'
		},
			    
		initialize: function() {
		    _.bindAll(this);
		    LocateUser(this.getStopList);
		},
		
		forceRefresh: function() {
		    App.ContentView.trigger('forceRefresh');
		    $('html,body').animate({scrollTop: this.$el.offset().top - 60 }, 'slow');
		},

		getStopList: function(location) {
		    this.render();
			var stopList = new StopList;
			stopList.location = location;
			var stopsListView = new StopListView({el: this.$('#stops'), collection: stopList});
		},

		render: function() {
		    this.$el.html(this.template());
		    return this;
		},
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
	    id: 'route-view',
	    
	    template: _.template($('#route-view-template').html()),
	    
	    events: {
			'change #route': 'routeSelected'
		},
		
	    initialize: function() {
	        this.firstUpdate = true;
			
			this.collection = new BusList({}, {routeIds: this.options.routeIds});
			this.collection.on('reset', this.addBuses, this);
			
			this.activeRoutesList = new ActiveRoutesList();
			this.activeRoutesList.on('reset', this.render, this);
			this.activeRoutesList.fetch({reset: true, dataType: 'jsonp'});
			
			this.updateBuses();
			App.Intervals.push(setInterval($.proxy(this.updateBuses, this), 30000));
			
			$(window).resize($.proxy(this.resize, this));
		},
		
		render: function() {
		    this.$el.html(this.template({ routes: this.activeRoutesList.toJSON() }));
		    this.setSelectedRoutes(this.options.routeIds && this.options.routeIds.split('/'));
		    
		    App.MapView.$el.height(window.innerHeight - $('.navbar').outerHeight(true) - this.$('select').outerHeight(true) - 10);
		    this.$('.mapcanvas').html(App.MapView.el);
			this.$('.mapcanvas').show();
			App.MapView.resize();
			
			return this;
		},
		
		resize: function() {
		    App.MapView.$el.height(window.innerHeight - $('.navbar').outerHeight(true) - this.$('select').outerHeight(true) - 10);
		    App.MapView.resize();
			App.MapView.setBounds();
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
		},
		
		routeSelected: function() {
			App.Router.navigate('routes/' + this.$('select option:selected').val(), {trigger: true});
		},
		
		setSelectedRoutes: function(routes) {
		    if(routes == null || routes == "") {
		        this.$('select option')[0].selected = true;
		        return;
		    }
		    
		    var indexOfEmpty = routes.indexOf('');
		    if(indexOfEmpty != -1) {
		        routes.splice(indexOfEmpty, 1);
		    }
		    
		    this.$('select option').each(function(index, option) {
		        option.selected = routes.indexOf(option.value) != -1;
		    });
		}
	});
	
	var FindStopsView = Backbone.View.extend({
	    id: 'find-stops-view',
	    
	    template: _.template($('#find-stops-view-template').html()),
		
		events: {
			'click #locate': 'locate',
			'click #search': 'search'
		},
		
	    initialize: function() {
	        this.collection = new Backbone.Collection([], {model: Stop});
	        this.collection.on('add', this.addStop, this);
	        this.collection.once('sync', function() {App.MapView.setBounds();}, this);
	        
	        App.MapView.clear();
	        App.MapView.setOnCenterChangedEvent($.proxy(this.findClosestStops, this));
	        $(window).resize($.proxy(this.resize, this));
	        
	        if(this.options.location) {
	            App.ContentView.once('contentChanged', function() {
	                this.onUserLocated(this.options.location);
	            }, this);
	        } else {
                this.locate();
            }
		},
		
		render: function() {
		    this.$el.html(this.template());
		    
		    this.resize();
		    this.$('.mapcanvas').html(App.MapView.el);
			this.$('.mapcanvas').show();
			
			return this;
		},
		
		resize: function() {
		    App.MapView.$el.height(window.innerHeight - $('.navbar').outerHeight(true) - this.$('#find-options').outerHeight(true));
		    App.MapView.resize();
			App.MapView.setBounds();
		},
		
		addStop: function(stop) {
		    App.MapView.createStopMarker(stop, true, function() {
		        App.Router.navigate('stops/' + stop.get('stopId'), {trigger: true});
		    });
		},
		
		findClosestStops: function(location) {
		    App.Router.navigate('findStops/' + location.lat() + '/' + location.lng() + '/');
		    this.collection.url = API_URL + 'stops/near/' + location.lat() + '/' + location.lng() + '/';
		    this.collection.fetch({remove: false, dataType: 'jsonp'});
		},
		
		locate: function() {
		    LocateUser($.proxy(this.onUserLocated, this));
		},
		
		onUserLocated: function(location) {
		    App.Router.navigate('findStops/' + location.lat() + '/' + location.lng() + '/');
	        App.MapView.createUserMarker(location, true);
	        App.MapView.resize();
	        App.MapView.center(location);
	        App.MapView.zoom(17);
	        this.findClosestStops(location);
	    },
		
		search: function() {
		    var intersection = this.$('#intersection').val();
		    var city = this.$('#city').val();
		    if(intersection == '') return;
		    
		    App.MapView.clear();
		    this.collection.once('sync', this.onSearchFinished, this);
		    this.collection.url = API_URL + 'stops/near/intersection/' + city + '/' + intersection + '/';
		    this.collection.fetch({dataType: 'jsonp'});
		},
		
		onSearchFinished: function() {
		    App.MapView.setBounds();
		    var location = App.MapView.center();
		    App.Router.navigate('findStops/' + location.lat() + '/' + location.lng() + '/');
		}
	});

	var FeedbackView = Backbone.View.extend({
		tagName: 'div',
		template: _.template($('#user-feedback-template').html()),
		render: function() {
		    this.$el.html(this.template());
		    return this;
		}

	})
	
	var ContentView = Backbone.View.extend({
		el: $(".app-container"),
		
		initialize: function() {
		    $('#jPanelMenu-menu').click(function() {
		        jPM.close();
		    });
		},
		
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
			"routes(/*routeIds)": "routeView",
			"findStops(/:lat/:lng)(/)": "findStopsView",
			"feedback(/)" : "feedbackView"
		 },
		
		homeView: function() {
		    this.clearIntervals();
			App.ContentView.setSubView(new HomeView);
			App.MapView.setDraggable(false);
		},
		
		stopView: function(stopIds) {
		    this.clearIntervals();
		    App.ContentView.setSubView(new StopsByIdView({stopIds: stopIds}));
		    App.MapView.setDraggable(false);
		},
		
		routeView: function(routeIds) {
		    this.clearIntervals();
		    App.ContentView.setSubView(new RouteView({routeIds: routeIds}));
		    App.MapView.setDraggable(true);
		    $('#loading').remove();
		},
		
		findStopsView: function(lat, lng) {
		    this.clearIntervals();
		    var location = lat && lng && new google.maps.LatLng(lat, lng);
		    App.ContentView.setSubView(new FindStopsView({location: location}));
		    App.MapView.setDraggable(true);
		    $('#loading').remove();
		},

		feedbackView: function() {
			this.clearIntervals();
			App.ContentView.setSubView(new FeedbackView);
			console.log("were you trying to go to feedback?");
		},
		
		clearIntervals: function() {
		    $(window).off('resize');
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
	
	var jPM = $.jPanelMenu({
	    direction: 'right',
	    excludedPanelContent: 'style, script, #disclaimer'
	});
	jPM.on();
	
	var DowntownNorfolk = new google.maps.LatLng(36.863794,-76.285608);
	var App = {
		ContentView: new ContentView,
		Router: new Router,
		MapView: new MapView,
		Intervals: []
	};
	
	App.Router.on('route', function() {
	    _gaq.push(['_trackPageview', location.pathname + location.hash]);
	});
	
	var root = document.URL.indexOf('/hrt-bus-finder') == -1 ? '/' : '/hrt-bus-finder/';
	Backbone.history.start({ root: root });
});
