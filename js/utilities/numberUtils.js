// Fix JavaScript Modulo of negative numbers
// http://javascript.about.com/od/problemsolving/a/modulobug.htm
Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
};

