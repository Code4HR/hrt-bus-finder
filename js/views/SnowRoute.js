var Backbone = require('backbone'),
		_ = require('underscore'),
		$ = require('jquery');
		// SnowRouteTemplate = require('./templates/SnowRoute.js');

module.exports = Backbone.View.extend({
	template: '<p>Missing template</p>',

	render: function() {
			this.$el.html(this.template());
			return this;
	},

});
