// Arrival Model.

module.exports = function() {
  return Backbone.Model.extend({
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

};
