define("dforma/util/string/toProperCase", ["dojo/_base/lang"], function(lang) {
lang.getObject("dforma.util.string", true);
dforma.util.string.toProperCase = function(/*String*/ value, force){
	return value.replace(/\w\S*/g, function(txt){
		return txt.charAt(0).toUpperCase() + (force ? txt.substr(1).toLowerCase() : txt.substr(1));
	});
};

String.prototype.toProperCase = function(force) {
	return dforma.util.string.toProperCase(this,force);
}

return dforma.util.string.toProperCase;

});