define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/request",
	"dojo/Deferred",
	"dojo/when",
	"dojo/promise/all",
	"dstore/Memory"
], function(declare,lang,request,Deferred,when,all,Memory) {
	var cache = new Memory();
	var modelUtil = lang.mixin(lang.getObject("dforma.util.model",true),{
		substitute:function(linkTemplate, instance, exclude){
			// modified from https://github.com/kriszyp/json-schema/blob/master/lib/links.js#L41
			exclude = exclude || [];
			return linkTemplate.replace(/\{([^\}]*)\}/g, function(t, property){
				var value = exclude.indexOf(property)>-1 ? "*" : instance[decodeURIComponent(property)];
				if(value instanceof Array){
					// the value is an array, it should produce a URI like /Table/(4,5,8) and store.get() should handle that as an array of values
					return '(' + value.join(',') + ')';
				}
				return value;
			});
		},
		coerce:function(data,schema,options) {
			options = options || {};
			data = lang.clone(data || {});
			if(!schema || !schema.properties) return new Deferred().resolve(data);
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
						value = value ? '' + value : '';
					} else if (type === 'number') {
						value = +value;
					} else if (type === 'boolean') {
						value = !!value;
					} else if (type === 'array') {
						if(!(value instanceof Array)) value = new Array();
					} else if (type === 'object') {
						if(!(value instanceof Object)) value = new Object();
					} else if (typeof type === 'function' && !(value instanceof type)) {
						value = new type(value);
					}
					data[k] = value;
				}
			}
			if(options.mixin) lang.mixin(data,options.mixin);
			if(options.resolve){
				return modelUtil.resolve(data,schema,options);
			} else {
				return new Deferred().resolve(data);
			}
		},
		clean:function(data,schema,options){
			// remove linked
			if(!schema || !schema.properties) return;
			options = options || {};
			var links = schema.links || [];
			links.forEach(function(link){
				if(!data[link.rel]) return;
				if(link.resolution=="lazy"){
					delete data[link.rel];
				}
			});
			for(var k in schema.properties){
				var p = schema.properties[k];
				if(p.type=="array" && data[k] && data[k] instanceof Array && p.items){
					if(p.items instanceof Array){
						// iterate p.items
						for(var i=0;i<p.items.length;i++){
							modelUtil.clean(data[k][i],p.items[i],options);
						}
					} else {
						for(var i=0;i<data[k].length;i++){
							modelUtil.coerce(data[k][i],p.items,options);
						}
					}
				}
			}
		},
		resolve:function(data,schema,options){
			options = options || {};
			var refattr = options.refProperty || "$ref";
			var exclude = options.exclude;
			var links = schema.links || [];
			links.forEach(function(link){
				if(!data[link.rel]) return;
				if(link.resolution=="lazy"){
					data[link.rel] = {};
					data[link.rel][refattr] = modelUtil.substitute(link.href,data,exclude);
				}
			});
			if(options.fetch){
				return modelUtil.fetch(data,schema,options);
			} else {
				return new Deferred().resolve(data);
			}
		},
		fetch:function(data,schema,options){
			var d = new Deferred();
			options = options || {};
			var refattr = options.refProperty || "$ref";
			var target = options.target;
			// allow for external properties, but won't be used when property isn't json-ref
			var resolveProps = options.resolveProperties ? [].concat(options.resolveProperties) : [];
			var toResolve = {};
			for(var k in schema.properties) {
				var p = schema.properties[k];
				if((p.type=="string" && p.format=="xhtml") || p.type=="array"){
					resolveProps.push(k);
				}
			}
			var cacheref = {};
			resolveProps.forEach(function(key){
				var href = data[key] ? data[key][refattr] : null;
				if(href) {
					var args = {
						handleAs:"json",
						headers:{
							accept:"application/json"
						}
					};
					var p = schema.properties[key];
					if(p && p.type=="string" && p.format=="xhtml") {
						args = {
							handleAs:"text"
						};
					}
					// absolute URI
					href = href.charAt(0) == "/" ? href : target + href;
					cacheref[href] = key;
					var cached = cache ? cache.getSync(href) : null;
					toResolve[href] = !!cached ? new Deferred().resolve(cached.value) : request(href,args);
				}
			});
			
			var proms = {};
			var handleResponse = function(resolved){
				var obj = {};
				for(var href in resolved){
					var k = cacheref[href];
					delete cacheref[href];
					var value = resolved[href];
					cache && cache.putSync({id:href,key:k,value:value});
					var p = schema.properties[k];
					if(p && p.type=="array" && p.items){
						proms[k] = [];
						if(p.items instanceof Array){
							// iterate p.items
							for(var i=0;i<p.items.length;i++){
								proms[k].push(modelUtil.coerce(value[i],p.items[i],options));
							}
						} else {
							for(var i=0;i<value.length;i++){
								proms[k].push(modelUtil.coerce(value[i],p.items,options));
							}
						}
					}
					obj[k] = value;
				}
				lang.mixin(data,obj);
				var proms2 = {};
				for(var k in proms) {
					proms2[k] = new Deferred();
					all(proms[k]).then(lang.hitch({key:k},function(resolved){
						proms2[this.key].resolve(resolved);
					}),function(err){
						console.error("Couldn't resolve "+k+". "+err.description);
						proms2[this.key].resolve({});
					});
				}
				return all(proms2).then(function(resolved){
					lang.mixin(data,resolved);
					d.resolve(data);
				},function(err){
					console.error(err.description);
					d.resolve(data);
				});
			}
			all(toResolve).then(handleResponse,function(err){
				handleResponse({});
			});
			return d;
		}
	});
	
	return modelUtil;
});
