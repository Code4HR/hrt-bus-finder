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