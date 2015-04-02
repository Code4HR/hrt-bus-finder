'use strict';

var Backbone = require('backbone'),
    $ = require('jquery'),
    _ = require('underscore'),
    ContentView = require('./contentView'),
    HomeView = require('./../views/HomeView'),
    StopsByIdView = require('./../views/StopsByIdView'),
    RouteView = require('./../views/RouteView'),
    FindStopsView = require('./../views/FindStopsView'),
    SnowRoute = require('./../views/SnowRoute'),
    intervalService = require('./intervalService.js');

var SNOW_ROUTES = false;

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

		clearIntervals: function() {
	    $(window).off('resize');
	    if(intervalService.get().length) {
        intervalService.clear();
	    }
		},

		snowRoute: function() {
  		ContentView.setSubView(new SnowRoute());
		}

	});
