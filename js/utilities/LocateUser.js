module.exports = function(onLocated) {

	    var onFail = function() {
	        onLocated(DowntownNorfolk);
	        $('#geolocation-failed').prependTo('#stops').fadeIn();
	    };

	    var timeout = setTimeout(onFail, 5000);

	    var onSuccess = function(position) {
	        clearTimeout(timeout);
	        onLocated(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
	    };

	    navigator.geolocation ?
			navigator.geolocation.getCurrentPosition(onSuccess, onFail) : onFail();
	};
