var app = app || {};

$(function(){

	var SNOW_ROUTES = false;

	var API_URL = 'http://lit-inlet-3610.herokuapp.com/api/'

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

	var Router = Backbone.Router.extend({
		 routes: {
			"": SNOW_ROUTES ? "snowRoute" : "homeView",
			"stops/*stopIds": SNOW_ROUTES ? "snowRoute" : "stopView",
			"routes(/*routeIds)": SNOW_ROUTES ? "snowRoute" : "routeView",
			"findStops(/:lat/:lng)(/)": SNOW_ROUTES ? "snowRoute" : "findStopsView",
			"feedback(/)" : SNOW_ROUTES ? "snowRoute" : "feedbackView"
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
		},

		snowRoute: function() {
			App.ContentView.setSubView(new SnowRoute);
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
