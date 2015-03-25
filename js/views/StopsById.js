var StopsByIdView = Backbone.View.extend({
	    id: 'stops',

		initialize: function() {
			var stopList = new StopList;
			stopList.stopIds = this.options.stopIds;
			var stopsListView = new StopListView({el: this.el, collection: stopList});
		}
	});