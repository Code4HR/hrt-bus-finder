//added require statements
var StopTemplate = require('./templates/stop-template-tpl.html');
    LocateUser = require('../utilities/LocateUser');

module.exports = Backbone.View.extend({
	    template: StopTemplate, // changed to StopTemplate from 
                          // old -- _.template($('#stop-list-template').html()),

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
