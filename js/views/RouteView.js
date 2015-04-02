var Backbone = require('backbone'),
		_ = require('underscore'),
		$ = require('jquery'),
		RouteViewTemplate = require('./templates/RouteView.tpl.html'),
		BusList = require('./../collections/BusList'),
		ActiveRoutesList = require('./../collections/ActiveRoutesList');

module.exports = Backbone.View.extend({
	    id: 'route-view',

	    template: RouteViewTemplate,

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
			Intervals.push(setInterval($.proxy(this.updateBuses, this), 30000));

			$(window).resize($.proxy(this.resize, this));
		},

		render: function() {
		    this.$el.html(this.template({ routes: this.activeRoutesList.toJSON() }));
		    this.setSelectedRoutes(this.options.routeIds && this.options.routeIds.split('/'));

		    MapView.$el.height(window.innerHeight - $('.navbar').outerHeight(true) - this.$('select').outerHeight(true) - 10);
		    this.$('.mapcanvas').html(MapView.el);
			this.$('.mapcanvas').show();
			MapView.resize();

			return this;
		},

		resize: function() {
		    MapView.$el.height(window.innerHeight - $('.navbar').outerHeight(true) - this.$('select').outerHeight(true) - 10);
		    MapView.resize();
			MapView.setBounds();
		},

		addBuses: function() {
			MapView.clear();
			MapView.createUserMarker(DowntownNorfolk);
			this.collection.each(function(bus){
			    MapView.createBusMarker(bus);
			});
			MapView.resize();
			if(this.firstUpdate){
			    MapView.setBounds();
			    this.firstUpdate = false;
		    }
	    },

		updateBuses: function() {
			this.collection.fetch({reset: true, dataType: 'jsonp'});
		},

		routeSelected: function() {
			Router.navigate('routes/' + this.$('select option:selected').val(), {trigger: true});
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
