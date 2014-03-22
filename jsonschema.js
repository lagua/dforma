define([
	"dojo/_base/lang",
	"dojo/_base/array",
	"dlagua/c/string/toProperCase"
],function(lang,array){
	var jsonschema = lang.getObject("dforma.jsonschema", true);
	lang.mixin(jsonschema,{
		schemasToControl:function(name,schemaList,data,options){
			if(!options) options = {};
			var control = {
				type:options.controllerType || "select",
				required:true,
				controller:true,
				name: name,
				options:[]
			};
			if(options.add) {
				options.edit = true;
				options["delete"] = true;
				control.addControls = options.controls;
			}
			if(control.type=="select") {
				control.searchAttr = "label";
				control.labelAttr = "label";
			}
			array.forEach(schemaList,function(schema,sindex){
				if(schema["default"]) control["default"] = schema[name];
				var id = schema.id ? schema.id : sindex;
				var titleProp = options.titleProperty || "title";
				var title = schema[titleProp] ? schema[titleProp] : (schema.id ? id.toProperCase() : "item"+id);
				var option = {
					id:id,
					label:title,
					schema:schema,
					controls:jsonschema.schemaToControls(schema, data, options)
				};
				if(options.edit===true || options["delete"]===true) {
					option.name = schema[name];
					option.id = schema.id;
					option.properties = schema.properties;
				}
				control.options.push(option);
			});
			if(data && data[name]) {
				control.value = data[name];
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
					var items = jsonschema.schemasToControl(c.name,[{
						properties:type=="repeat"? prop.items : prop.properties
					}],null,{
						controllerType:type
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
					c.controls = options.controls;
				}
				if(options.hasOwnProperty("delete") && options["delete"]===true) c["delete"] = true;
				if(options.hasOwnProperty("description")) {
					c.description = prop[options.description];
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