'use strict';

var Intervals = [];

function getIntervals() {
  return Intervals;
}

function setIntervals(input) {

}

function clearIntervals() {
  Intervals = [];
}

module.exports =  {
  get: getIntervals,
  set: setIntervals,
  clear: clearIntervals
};
