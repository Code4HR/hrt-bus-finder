module.exports = Backbone.View.extend({
	    id: 'find-stops-view',

	    template: _.template($('#find-stops-view-template').html()),

		events: {
			'click #locate': 'locate',
			'click #search': 'search'
		},

	    initialize: function() {
	        this.collection = new Backbone.Collection([], {model: Stop});
	        this.collection.on('add', this.addStop, this);
	        this.collection.once('sync', function() {MapView.setBounds();}, this);

	        MapView.clear();
	        MapView.setOnCenterChangedEvent($.proxy(this.findClosestStops, this));
	        $(window).resize($.proxy(this.resize, this));

	        if(this.options.location) {
	            ContentView.once('contentChanged', function() {
	                this.onUserLocated(this.options.location);
	            }, this);
	        } else {
                this.locate();
            }
		},

		render: function() {
		    this.$el.html(this.template());

		    this.resize();
		    this.$('.mapcanvas').html(MapView.el);
			this.$('.mapcanvas').show();

			return this;
		},

		resize: function() {
		    MapView.$el.height(window.innerHeight - $('.navbar').outerHeight(true) - this.$('#find-options').outerHeight(true));
		    MapView.resize();
			MapView.setBounds();
		},

		addStop: function(stop) {
		    MapView.createStopMarker(stop, true, function() {
		        Router.navigate('stops/' + stop.get('stopId'), {trigger: true});
		    });
		},

		findClosestStops: function(location) {
		    Router.navigate('findStops/' + location.lat() + '/' + location.lng() + '/');
		    this.collection.url = API_URL + 'stops/near/' + location.lat() + '/' + location.lng() + '/';
		    this.collection.fetch({remove: false, dataType: 'jsonp'});
		},

		locate: function() {
		    LocateUser($.proxy(this.onUserLocated, this));
		},

		onUserLocated: function(location) {
		    Router.navigate('findStops/' + location.lat() + '/' + location.lng() + '/');
	        MapView.createUserMarker(location, true);
	        MapView.resize();
	        MapView.center(location);
	        MapView.zoom(17);
	        this.findClosestStops(location);
	    },

		search: function() {
		    var intersection = this.$('#intersection').val();
		    var city = this.$('#city').val();
		    if(intersection == '') return;

		    MapView.clear();
		    this.collection.once('sync', this.onSearchFinished, this);
		    this.collection.url = API_URL + 'stops/near/intersection/' + city + '/' + intersection + '/';
		    this.collection.fetch({dataType: 'jsonp'});
		},

		onSearchFinished: function() {
		    MapView.setBounds();
		    var location = MapView.center();
		    Router.navigate('findStops/' + location.lat() + '/' + location.lng() + '/');
		}
	});