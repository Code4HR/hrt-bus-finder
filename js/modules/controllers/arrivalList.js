module.exports = function() {

  return Backbone.Collection.extend({
    model: Arrival,

    comparator: function(arrival) {
        return arrival.minutesFromNow();
        },

    url: function() {
      return API_URL + 'stop_times/' + this.stopId + '/';
    }
  });

};
