var Backbone = require('backbone'),
    $ = require('jquery');

    Backbone.$ = $;

module.exports = Backbone.View.extend({

  el: $(".app-container"),

	initialize: function() {
    console.log('hello from the content view.');
	},

	setSubView: function(subView) {
		this.subView && this.subView.remove();
		this.subView = subView;
		this.$el.html(this.subView.render().el);
		this.$el.trigger('create');
		this.trigger('contentChanged');
	}
});
