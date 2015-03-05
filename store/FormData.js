define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/when",
	"dojo/store/util/QueryResults",
	"dstore/Memory",
	"dstore/Rest",
	"dstore/SimpleQuery",
	"dstore/Trackable",
	"dforma/util/model"
], function(declare,lang,arrayUtil,when,QueryResults,Memory,Rest,SimpleQuery,Trackable,modelUtil) {
	
	return declare("dlagua.c.store.FormData",[],{
		idProperty: "id",
		model:"",
		schemaModel:"Class",
		service:"/model/",
		local:false,
		persistent:false,
		refAttribute:"$ref",
		getSchema:function(){
			return request(this.schemaUri,{
				handleAs:"json",
				headers:{
					accept:"application/json"
				}
    		});
		},
		put:function(obj,options){
			return when(this.inherited(arguments),lang.hitch(this,function(obj){
				var fn = this.local ? "coerce" : "fetch";
				return modelUtil[fn](object,schema,{
					resolve:true,
					fetch:true,
					refAttribute:this.refAttribute,
					target:this.target
				});
			}));
		},
		constructor: function(options) {
			this.headers = {};
			lang.mixin(this, options);
			var model = this.model;
			var schemaModel = this.schemaModel;
			if(model) this.target = this.service+model+"/";
			this.schemaUri = this.service+schemaModel+"/"+model;
			var Store,store = this;
			if(this.local) {
				Store = declare([Memory,Trackable]);
				store = new Store({
					idProperty: this.idProperty,
					data:this.data
				});
			} else {
				Store = declare([Rest,SimpleQuery,Trackable]);
				store = new Store({
					useRangeHeaders:true,
					idProperty: this.idProperty,
					target:this.target
				});
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