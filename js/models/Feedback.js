module.exports = Backbone.Model.extend({
		defaults: {
			name: '',
			emailAddress: '',
			message: ''
		},

		validate: function(attribs) {
			if(attribs.message === undefined) {
				return "A message was not included.";
			}
		}
});