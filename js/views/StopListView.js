var Backbone = require('backbone'),
		_ = require('underscore'),
		$ = require('jquery'),
		StopView = require('./../views/StopView');

module.exports = Backbone.View.extend({

	initialize: function() {
		this.collection.on('reset', this.render, this);
		this.collection.fetch({reset: true, dataType: 'jsonp'});
	},

	render: function() {
		$('#loading').remove();
		this.collection.each(this.addStop, this);
	},

	addStop: function(stop) {
		var stopView = new StopView({model: stop});
		this.$el.append(stopView.render().$el);
	}

});
