define([
	"dojo/_base/lang",
	"dojo/_base/array"
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
				//this.allowFreeKey = true;
				//this.addControls = options.controls;
			}
			if(control.type=="select") {
				control.searchAttr = "label";
				control.labelAttr = "label";
			}
			if(options.edit===true || options["delete"]===true) {
				//this.allowOptionalDeletion = false;
			}
			array.forEach(schemaList,function(schema,sindex){
				if(schema["default"]) control["default"] = schema[name];
				var id = schema.id ? schema.id : sindex;
				var title = schema.title ? schema.title : (schema.id ? toProperCase(id) : "item"+id);
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
			if(options.selectFirst) control.value = control.options[0].id;
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
				} else if(prop.type=="float") {
					type = "number";
				} else if(prop.type=="date") {
					type = "date";
				} else if(prop.type=="array") {
					if(prop.format == "list") {
						// TODO: create list type
						type = "list";
					} else {
						type = "repeat";
					}
				} else if(prop.type=="object") {
					type = "group";
				} else if(prop.type=="string" && prop.format=="text"){
					type = "textarea";
				} else {
					type = "input";
				}
				if(lang.isArray(prop["enum"]) && prop["enum"].length) {
					type = "select";
				}
				var c = {
					name:k,
					type:type,
					schema:prop,
					required:(prop.required === true),
					disabled:(prop.readonly === true)
				};
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
				if(type=="select") {
					c.options = [];
					array.forEach(prop["enum"],function(op) {
						c.options.push({id:op});
					});
				}
				if(type=="repeat" || type=="group"){
					var items = jsonschema.schemasToControl(c.name,[{
						properties:type=="repeat"? prop.items : prop.properties
					}],null,{
						controllerType:type
					});
					c = lang.mixin(c,items);
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
