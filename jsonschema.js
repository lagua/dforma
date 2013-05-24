define(["dojo/_base/lang","./jsv","./json-schema-draft-03"],function(lang,jsv){
	lang.getObject("dforma", true);
	var JSV = jsv.JSV;
	dforma.jsonschema = JSV.createEnvironment();
	return dforma.jsonschema;
});

