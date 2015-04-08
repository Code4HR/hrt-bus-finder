var Backbone = require('backbone'),
		_ = require('underscore'),
		$ = require('jquery');

		var Router = require('./utilities/router');
		var dateUtils = require('./utilities/dateUtils');

		dateUtils();

Backbone.$ = $;

$(function () {

	var router = new Router();
	var root = document.URL.indexOf('/hrt-bus-finder') == -1 ? '/' : '/hrt-bus-finder/';
	Backbone.history.start({ root: root });

});
