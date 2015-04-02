var Backbone = require('backbone'),
		_ = require('underscore'),
		$ = require('jquery');

		var StopList = require('./../collections/StopList');
		var StopListView = require('./../views/StopListView');

module.exports = Backbone.View.extend({
  id: 'stops',

	initialize: function() {
		var stopList = new StopList;
		stopList.stopIds = this.options.stopIds;
		var stopsListView = new StopListView({el: this.el, collection: stopList});
	}
});
