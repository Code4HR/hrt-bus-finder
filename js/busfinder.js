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

<<<<<<< HEAD
=======
	var SnowRoute = Backbone.View.extend({
		template: _.template($('#snow-route-template').html()),

		render: function() {
				this.$el.html(this.template());
				return this;
		},

	});

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
	        this.collection = new Backbone.Collection([], {model: app.Stop});
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

>>>>>>> 34836e54d2d34636c2d8e351b317f90091ca660a
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
