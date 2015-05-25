'use strict';

var $ = global.jquery || require('jquery');

module.exports = function set(route) {
  $('.active-route').removeClass('active-route');
  $('li > [href="' + route + '"]').addClass('active-route');
};
