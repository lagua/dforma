define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/request",
	"dojo/Deferred",
	"dojo/when",
	"dojo/promise/all"
], function(declare,lang,request,Deferred,when,all) {
	
	// from https://github.com/kriszyp/json-schema/blob/master/lib/links.js#L41
	function substitute(linkTemplate, instance, exclude){
		exclude = exclude || [];
		return linkTemplate.replace(/\{([^\}]*)\}/g, function(t, property){
			var value = exclude.indexOf(property)>-1 ? "*" : instance[decodeURIComponent(property)];
			if(value instanceof Array){
				// the value is an array, it should produce a URI like /Table/(4,5,8) and store.get() should handle that as an array of values
				return '(' + value.join(',') + ')';
			}
			return value;
		});
	};
	
	var model = lang.mixin(lang.getObject("dforma.util.model",true),{
		coerce:function(data,schema,options) {
			options = options || {};
			data = data || {};
			var proms = {};
			// summary:
			// Given an input value, this method is responsible
			// for converting it to the appropriate type for storing on the object.
			for(var k in schema.properties) {
				var p = schema.properties[k];
				var type = p.type;
				var deft = p["default"];
				var value = data[k]!==undefined ? data[k] : deft ? deft : undefined;
				if(type) {
					if (type === 'string') {
						data[k] = '' + value;
					} else if (type === 'number') {
						value = +value;
					} else if (type === 'boolean') {
						value = !!value;
					} else if (type === 'array') {
						if(!(value instanceof Array)) value = new Array();
						if(p.items){
							proms[k] = [];
							if(p.items instanceof Array){
								// iterate p.items
								for(var i=0;i<p.items.length;i++){
									proms[k].push(model.coerce(value[i],p.items[i],options));
								}
							} else {
								for(var i=0;i<value.length;i++){
									proms[k].push(model.coerce(value[i],p.items,options));
								}
							}
						}
					} else if (type === 'object') {
						if(!(value instanceof Object)) value = new Object();
					} else if (typeof type === 'function' && !(value instanceof type)) {
						value = new type(value);
					}
					data[k] = value;
				}
			}
			var proms2 = {};
			for(var k in proms) {
				all(proms[k]).then(lang.hitch({key:k},function(arr){
					data[this.key] = arr;
					proms2[this.key] = new Deferred().resolve(data);
				}));
			}
			return all(proms2).then(function(resolved){
				console.warn(resolved)
				lang.mixin(data,resolved)
				if(options.resolve){
					return model.resolve(data,schema,options);
				} else {
					return new Deferred().resolve(data);
				}
			});
		},
		resolve:function(data,schema,options){
			options = options || {};
			var refattr = options.refProperty || "$ref";
			var exclude = options.exclude;
			if(schema.links instanceof Array) {
				schema.links.forEach(function(link){
					if(!data[link.rel]) return;
					if(link.resolution=="lazy"){
						data[link.rel] = {};
						data[link.rel][refattr] = substitute(link.href,data,exclude);
					}
				});
			}
			if(options.fetch){
				return model.fetch(data,schema,options);
			} else {
				return new Deferred().resolve(data);
			}
		},
		fetch:function(data,schema,options){
			var d = new Deferred();
			options = options || {};
			var refattr = options.refProperty || "$ref";
			var target = options.target;
			// FIXME move to new instance from schema for local store
			var resolveProps = options.resolveProps || [];
			var toResolve = {};
			if(typeof resolveProps == "string") {
				resolveProps = resolveProps.split(",");
			}
			for(var k in schema.properties) {
				var p = schema.properties[k];
				if((p.type=="string" && p.format=="xhtml") || p.type=="array"){
					resolveProps.push(k);
				}
			}
			resolveProps.forEach(function(key){
				var href = data[key] ? data[key][refattr] : null;
				if(href) {
					var req = {
						handleAs:"json",
						headers:{
							accept:"application/json"
						}
					};
					var p = schema.properties[key];
					if(p.type=="string" && p.format=="xhtml") {
						// shouldn't we try to resolve XML?
						req = {
							handleAs:"text",
							failOk:true
						};
					}
					console.log("Link "+key+" will be resolved.");
					// absolute URI
					href = href.charAt(0) == "/" ? href : target + href;
					toResolve[key] = request(href,req);
				} else {
					console.warn("Link "+key+" won't be resolved.");
				}
			});
			all(toResolve).then(function(resolved){
				lang.mixin(data,resolved);
				d.resolve(data);
			});
			return d;
		}
	});
	
	return model;
});
