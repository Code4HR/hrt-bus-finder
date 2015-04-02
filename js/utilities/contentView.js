'use strict';

var Backbone = require('backbone'),
    $ = require('jquery');

module.exports = Backbone.View.extend({
	el: $(".app-container"),

	initialize: function() {

	},

	setSubView: function(subView) {
		this.subView && this.subView.remove();
		this.subView = subView;
		this.$el.html(this.subView.render().el);
		this.$el.trigger('create');
		this.trigger('contentChanged');
	}
});
