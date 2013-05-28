define([
	"dojo/_base/lang",
	"jsv/lib/jsv",
	"jsv/lib/json-schema-draft-03"
],function(lang,_jsv){
	lang.getObject("dforma", true);
	var JSV = _jsv.JSV;
	dforma.jsonschema = JSV.createEnvironment();
	return dforma.jsonschema;
});
