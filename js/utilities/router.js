module.exports = Backbone.Router.extend({
		 routes: {
			"": SNOW_ROUTES ? "snowRoute" : "homeView",
			"stops/*stopIds": SNOW_ROUTES ? "snowRoute" : "stopView",
			"routes(/*routeIds)": SNOW_ROUTES ? "snowRoute" : "routeView",
			"findStops(/:lat/:lng)(/)": SNOW_ROUTES ? "snowRoute" : "findStopsView",
			"feedback(/)" : SNOW_ROUTES ? "snowRoute" : "feedbackView"
		 },

		homeView: function() {
		  this.clearIntervals();
			ContentView.setSubView(new HomeView());
			// MapView.setDraggable(false);
		},

		stopView: function(stopIds) {
		    this.clearIntervals();
		    ContentView.setSubView(new StopsByIdView({stopIds: stopIds}));
		    // MapView.setDraggable(false);
		},

		routeView: function(routeIds) {
		    this.clearIntervals();
		    ContentView.setSubView(new RouteView({routeIds: routeIds}));
		    // MapView.setDraggable(true);
		    $('#loading').remove();
		},

		findStopsView: function(lat, lng) {
		    this.clearIntervals();
		    var location = lat && lng && new google.maps.LatLng(lat, lng);
		    ContentView.setSubView(new FindStopsView({location: location}));
		    // MapView.setDraggable(true);
		    $('#loading').remove();
		},

		feedbackView: function() {
			this.clearIntervals();
			ContentView.setSubView(new FeedbackView());
			console.log("were you trying to go to feedback?");
		},

		clearIntervals: function() {
		    $(window).off('resize');
		    while(App.Intervals.length) {
		        clearInterval(App.Intervals.pop());
		    }
		},

		snowRoute: function() {
			ContentView.setSubView(new SnowRoute());
		}

	});
