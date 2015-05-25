'use strict';

var $ = global.jquery || require('jquery');

var active;

function clear() {
  $('.active-route')
    .removeClass('active-route')
    .addClass('inactive-route');
}

module.exports = function set(route) {
  clear();
  active = route;
  $('[href="' + route + '"]').addClass('active-route');
};
