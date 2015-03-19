(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = app || {};

module.exports = Backbone.Model.extend({
		idAttribute: "_id",

		date: function() {
			return new Date(Date.parseUtc(this.get('arrival_time')));
		},

		localTime: function() {
			return this.date().to12HourString();
		},

		minutesFromNow: function() {
			var arriveTime = this.date();
			if(this.get('busAdherence')) {
				arriveTime = arriveTime.addMinutes(this.get('busAdherence') * -1);
			}

			var arriveTimeFromNow = new Date(arriveTime - new Date().getTime());
			return (arriveTimeFromNow.getTime() / 1000 / 60 | 0);
		},

		adherenceDescription: function() {
			if(!this.has('busAdherence'))
		        return 'scheduled';

		    var adherence = this.get('busAdherence');
		    if(adherence > 0)
    		    return adherence + ' min early';
			if(adherence < 0)
				return (adherence * -1) + ' min late';
			return 'on time'
		},

		lastCheckinTimeDescription: function() {
		    if(!this.has('busCheckinTime'))
		        return '';

		    var date = new Date(Date.parseUtc(this.get('busCheckinTime')));
			var timePassed = new Date(new Date().getTime() - date).getTime() / 1000 / 60 | 0;

			if (timePassed == 0)
			    return 'just now';
			else if (timePassed == 1)
			    return '1 minute ago';

			return timePassed + ' minutes ago';
		}
	});

},{}],2:[function(require,module,exports){
var app = app || {};

$(function(){
	app.Stop = Backbone.Model.extend({
		idAttribute: "_id"
	});

});

},{}]},{},[1,2]);
