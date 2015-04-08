module.exports = function() {
  
  // Create addHours function for Date object so we can
  // easily get from GMT to EST (probably need to find a library for this)
  Date.prototype.addHours = function(h){
    this.setHours(this.getHours()+h);
  	return this;
  };

  Date.prototype.addMinutes = function(m){
  	this.setMinutes(this.getMinutes()+m);
  	return this;
  };

  Date.prototype.to12HourString = function(m){
  	var dd = "AM";
  	var hours = this.getHours();
  	var mins = this.getMinutes();
  	if (hours >= 12) {
  	  hours = hours - 12;
  		dd = "PM";
  	}
  	if (hours === 0) {
  		hours = 12;
  	}

  	mins = mins < 10 ? "0"+mins : mins;

  	return hours + ":" + mins + " " + dd;
  };

  Date.parseUtc = function(input){
  	var parts = input.match(/(\d+)/g);
  	// new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
  	return Date.UTC(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]); // months are 0-based
  };

};
