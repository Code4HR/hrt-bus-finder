module.exports = Backbone.View.extend({

		debugger;

		el: $(".app-container"),

		initialize: function() {
		    $('#jPanelMenu-menu').click(function() {
		        jPM.close();
		    });
		},

		setSubView: function(subView) {
			debugger;
			this.subView && this.subView.remove();
			this.subView = subView;
			this.$el.html(this.subView.render().el);
			this.$el.trigger('create');
			this.trigger('contentChanged');
		}

});
