define([
	"dojo/_base/lang",
	"dojo/_base/array",
	"dforma/util/string/toProperCase"
],function(lang,array){
	var jsonschema = lang.getObject("dforma.jsonschema", true);
	lang.mixin(jsonschema,{
		schemasToController:function(schemaList,data,options){
			if(!options) options = {};
			var control = lang.mixin({
				type:"select",
				required:true,
				controller:true,
				searchAttr:"label",
				options:[]
			},options.controller ? options.controller : {});
			if(options.add) {
				options.edit = true;
				options["delete"] = true;
				control.editControls = options.editControls;
			}
			array.forEach(schemaList,function(schema,sindex){
				if(schema["default"]) control["default"] = schema["default"];
				var titleProp = options.titleProperty || "title";
				var idProp = options.idProperty || "id";
				var id = schema[idProp] ? schema[idProp] : sindex;
				var title = schema[titleProp] ? schema[titleProp] : (schema[idProp] ? id.toProperCase() : "item"+sindex);
				var option = {
					id:id,
					label:title,
					schema:schema,
					controls:jsonschema.schemaToControls(schema, data, options)
				};
				// FIXME what's this?
				if(options.edit===true || options["delete"]===true) {
					option.name = schema[control.name];
					option.id = schema[idProp];
					option.properties = schema.properties;
				}
				control.options.push(option);
			});
			if(data && data[control.name]) {
				control.value = data[control.name];
			} else if(options.selectFirst) {
				control.value = control.options[0].id;
			}
			return control;
		},
		schemaToControls:function(schema,data,options){
			options = options || {};
			var properties = schema.properties;
			var controls = [];
			for(var k in properties) {
				var prop = properties[k];
				// TODO: add more types
				var type;
				if(prop.type=="boolean") {
					type = "checkbox";
				} else if(prop.type=="integer") {
					type = "spinner";
				} else if(prop.type=="number") {
					if(prop.format=="currency") {
						type = "currency";
					} else {
						type = "number";
					}
				} else if(prop.type=="date") {
					type = "date";
				} else if(prop.type=="array" || prop.hasOwnProperty("enum") || prop.hasOwnProperty("oneOf")) {
					if(prop.format == "list") {
						type = "list";
					} else if(prop.format == "select") {
						type = "select";
					} else if(prop.format == "radiogroup") {
						type = "radiogroup";
					} else {
						type = "repeat";
					}
				} else if(prop.type=="object") {
					type = "group";
				} else if(prop.type=="string" && prop.format=="text"){
					type = "textarea";
				} else {
					if(prop.format=="email") {
						type = "email";
					} else if(prop.format=="phone") {
						type = "phone";
					} else {
						type = "input";
					}
				}
				var c = {
					name:k,
					type:type,
					schema:prop,
					required:(prop.required === true),
					readonly:(prop.readonly === true)
				};
				if(type=="currency") {
					c.currency = prop.currency || "EUR";
				}
				if(prop.hasOwnProperty("invalidMessage")) {
					c.invalidMessage = prop.invalidMessage;
				}
				if(prop.hasOwnProperty("minimum") || prop.hasOwnProperty("maximum")) {
					c.constraints = {};
					if(prop.hasOwnProperty("minimum")) c.constraints.min = prop.minimum;
					if(prop.hasOwnProperty("maximum")) c.constraints.max = prop.maximum;
				}
				if(prop.hasOwnProperty("title")) {
					c.title = prop.title;
				}
				if(prop.hasOwnProperty("description")) {
					c.description = prop.description;
				}
				if(type=="list") {
					c.columns = prop.columns;
					c.controller = prop.controller;
				}
				if(type=="select" || type=="radiogroup") {
					c.options = [];
					if(prop.hasOwnProperty("enum")) {
						array.forEach(prop["enum"],function(op) {
							c.options.push({id:op});
						});
					} else if(prop.hasOwnProperty("oneOf")) {
						c.options = prop.oneOf;
					}
				}
				if(type=="checkbox" && prop.hasOwnProperty("enum")) {
					c.isValid = prop["enum"];
				}
				if(type=="repeat" || type=="group"){
					var items = jsonschema.schemasToController([{
						properties:type=="repeat"? prop.items : prop.properties
					}],null,{
						controller:{
							type:type,
							name:c.name
						}
					});
					c = lang.mixin(c,items);
				}
				if(prop.format=="hidden") {
					c.hidden = true;
				}
				if(prop.dialog) {
					c.dialog = prop.dialog;
				}
				if(prop.format=="unhidebutton") {
					c.type = "unhidebutton";
					if(prop.target) c.target = prop.target;
				}
				if(options.hasOwnProperty("edit") && options.edit===true) {
					c.edit = true;
					c.editControls = options.editControls;
				}
				if(options.hasOwnProperty("delete") && options["delete"]===true) c["delete"] = true;
				if(options.hasOwnProperty("descriptionProperty")) {
					c.description = prop[options.descriptionProperty];
				}
				if(data && data.hasOwnProperty(k)) {
					c.value = data[k];
				} else if(prop.hasOwnProperty("default")) {
					c.value = prop["default"];
				}
				controls.push(c);
			}
			return controls;
		}
	});
	return jsonschema;
});