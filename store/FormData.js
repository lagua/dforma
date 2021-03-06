define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/aspect",
	"dojo/Deferred",
	"dojo/when",
	"dojo/request",
	"dojo/store/util/QueryResults",
	"dstore/Memory",
	"dstore/Rest",
	"dstore/LocalDB",
	"dstore/SimpleQuery",
	"dstore/Trackable",
	"dforma/util/model"
], function(declare,lang,arrayUtil,aspect,Deferred,when,request,QueryResults,Memory,Rest,LocalDB,SimpleQuery,Trackable,modelUtil) {

	return declare("dforma.store.FormData",[],{
		idProperty: "id",
		model:"",
		schema:null,
		schemaModel:"Class",
		service:"model/",
		local:false,
		persistent:false,
		mixin:null,
		cache:null,
		refProperty:"_ref",
		getSchema:function(sync){
			if(this.schema || !this.model) {
			    if(this.schema instanceof Deferred) return this.schema;
			    return new Deferred().resolve(this.schema);
			}
			var uri = this.service+this.schemaModel+"/"+this.model;
			this.schema = request(uri,{
				handleAs:"json",
				sync:!!sync,
				headers:{
					accept:"application/json"
				}
    		});
			when(this.schema,lang.hitch(this,function(schema){
				this.schema = schema;
				for(var k in schema.properties) {
					if(schema.properties[k].primary) this.idProperty = k;
					if(schema.properties[k].hrkey) this.hrProperty = k;
				}
			}),function(err){
				console.error("Schema " + uri + " not available",err);
			});
			return this.schema;
		},
		processModel: function(object,options,req) {
			options = options || {};
			//modelUtil.clean(object,this.schema);
			req = req || new Deferred().resolve(object);
			if(options.noop) return req;
			return when(req,lang.hitch(this,function(object){
				return modelUtil.coerce(object,this.schema,{
					resolve:true,
					fetch:true,
					refProperty:this.refProperty,
					target:this.target,
					mixin:this.mixin,
					cache:this.cache
				});
			}));
		},
		constructor: function(options) {
			this.headers = {};
			lang.mixin(this, options);
			var schemaModel = this.schemaModel;
			if(!this.model && this.target) {
				this.model = (/([^\/]*)\/?$/g).exec(this.target).pop();
			} else {
				this.target = this.service+this.model+"/";
			}
			if(!this.schema){
				this.getSchema(true);
			}
			// used for resolved urls, optimize by overriding
			this.cache = new Memory();
			var Store,store = this;
			if(this.local && this.persistent) {
				// TODO manage in app config
				var dbConfig = window.dbConfig || {
				    version: 1,
				    stores: {}
				};
				Store = declare([LocalDB,Trackable]);
				store = new Store({
					idProperty: this.idProperty,
					dbConfig:dbConfig,
					storeName:this.target
				});
			} else if(this.local) {
				Store = declare([Memory,Trackable]);
				store = new Store({
					idProperty: this.idProperty,
					data:this.data
				});
			} else {
				Store = declare([Rest,Trackable]);
				store = new Store({
					useRangeHeaders:true,
					idProperty: this.idProperty,
					target:this.target
				});
			}
			if(this.schema){
				aspect.around(store,"put",lang.hitch(this,function(put){
					return function(object,options) {
						var req = put.call(this,object,options);
						return this.processModel(object,options,req);
					};
				}));
				aspect.around(store,"add",lang.hitch(this,function(add){
					return function(object,options) {
						var req = add.call(this,object,options);
						return this.processModel(object,options,req);
					};
				}));
				aspect.around(store,"get",lang.hitch(this,function(get){
					return function(object,options) {
						var req = get.call(this,object,options);
						return this.processModel(object,options,req);
					};
				}));
			}
			// also mixin constructor!
			lang.mixin(this,store);
			if(store._getQuerierFactory('filter') || store._getQuerierFactory('sort')) {
				this.queryEngine = function (query, options) {
					options = options || {};

					var filterQuerierFactory = store._getQuerierFactory('filter');
					var filter = filterQuerierFactory ? filterQuerierFactory(query) : passthrough;

					var sortQuerierFactory = store._getQuerierFactory('sort');
					var sort = passthrough;
					if (sortQuerierFactory) {
						sort = sortQuerierFactory(arrayUtil.map(options.sort, function (criteria) {
							return {
								property: criteria.attribute,
								descending: criteria.descending
							};
						}));
					}

					var range = passthrough;
					if (!isNaN(options.start) || !isNaN(options.count)) {
						range = function (data) {
							var start = options.start || 0,
								count = options.count || Infinity;

							var results = data.slice(start, start + count);
							results.total = data.length;
							return results;
						};
					}

					return function (data) {
						return range(sort(filter(data)));
					};
				};
			}
			var objectStore = this;
			// we call notify on events to mimic the old dojo/store/Trackable
			store.on('add,update,delete', function (event) {
				var type = event.type;
				var target = event.target;
				objectStore.notify(
					(type === 'add' || type === 'update') ? target : undefined,
					(type === 'delete' || type === 'update') ?
						('id' in event ? event.id : store.getIdentity(target)) : undefined);
			});
		},
		query: function (query, options) {
			// summary:
			//		Queries the store for objects. This does not alter the store, but returns a
			//		set of data from the store.
			// query: String|Object|Function
			//		The query to use for retrieving objects from the store.
			// options: dstore/api/Store.QueryOptions
			//		The optional arguments to apply to the resultset.
			// returns: dstore/api/Store.QueryResults
			//		The results of the query, extended with iterative methods.
			//
			// example:
			//		Given the following store:
			//
			//	...find all items where "prime" is true:
			//
			//	|	store.query({ prime: true }).forEach(function(object){
			//	|		// handle each object
			//	|	});
			if(typeof query == "string" && query.charAt(0)=="?") query = query.substr(1);
			options = options || {};

			var results = this.filter(query);
			var queryResults;

			// Apply sorting
			var sort = options.sort;
			if (sort) {
				if (Object.prototype.toString.call(sort) === '[object Array]') {
					var sortOptions;
					while ((sortOptions = sort.pop())) {
						results = results.sort(sortOptions.attribute, sortOptions.descending);
					}
				} else {
					results = results.sort(sort);
				}
			}

 			var tracked;
			if (results.track && !results.tracking) {
				// if it is trackable, always track, so that observe can
				// work properly.
				results = results.track();
				tracked = true;
			}
			if ('start' in options) {
				// Apply a range
				var start = options.start || 0;
				// object stores support sync results, so try that if available
				queryResults = results[results.fetchRangeSync ? 'fetchRangeSync' : 'fetchRange']({
					start: start,
					end: options.count ? (start + options.count) : Infinity
				});
				queryResults.total = queryResults.totalLength;
			}
			queryResults = queryResults || new QueryResults(results[results.fetchSync ? 'fetchSync' : 'fetch']());
			queryResults.observe = function (callback, includeObjectUpdates) {
				// translate observe to event listeners
				function convertUndefined(value) {
					if (value === undefined && tracked) {
						return -1;
					}
					return value;
				}
				var addHandle = results.on('add', function (event) {
					callback(event.target, -1, convertUndefined(event.index));
				});
				var updateHandle = results.on('update', function (event) {
					if (includeObjectUpdates || event.previousIndex !== event.index || !isFinite(event.index)) {
						callback(event.target, convertUndefined(event.previousIndex), convertUndefined(event.index));
					}
				});
				var removeHandle = results.on('delete', function (event) {
					callback(event.target, convertUndefined(event.previousIndex), -1);
				});
				var handle = {
					remove: function () {
						addHandle.remove();
						updateHandle.remove();
						removeHandle.remove();
					}
				};
				handle.cancel = handle.remove;
				return handle;
			};
			return queryResults;
		},
		notify: function () {

		}
	});

});
