'use strict';

var Intervals = [];

function getIntervals() {
  return Intervals;
}

function setIntervals(input) {
  Intervals.push(input);
}

function clearIntervals() {
  Intervals = [];
}

module.exports =  {
  get: getIntervals,
  push: setIntervals,
  clear: clearIntervals
};
