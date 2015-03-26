var FeedbackView = Backbone.View.extend({
		tagName: 'div',
		template: _.template($('#user-feedback-template').html()),
		render: function() {
		    this.$el.html(this.template());
		    return this;
		}

	})
