var Backbone = require('backbone'),
		_ = require('underscore'),
		$ = require('jquery');

module.exports = Backbone.View.extend({
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
			msg += '<br>on route ' + bus.get('routeId');

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
