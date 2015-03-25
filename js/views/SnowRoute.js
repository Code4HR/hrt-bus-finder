	var SnowRoute = Backbone.View.extend({
		template: _.template($('#snow-route-template').html()),

		render: function() {
				this.$el.html(this.template());
				return this;
		},

	});