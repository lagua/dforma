/*
simple grouping panel for form elements
*/
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dojo/dom-class",
	"dojo/aspect",
	"dgrid/OnDemandList",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"./_ArrayWidgetBase",
	"./Group",
	"./util/i18n",
	"dijit/registry",
	"dijit/form/Button"
],function(declare,lang,array,domConstruct,domAttr,domClass,aspect,
		OnDemandList,Selection,DijitRegistry,
		_ArrayWidgetBase,Group,i18n,
		registry,Button){
	
	var Row = declare("dforma.RepeatRow",[Group],{
		edit:true,
		remove:true,
		removeButton:null,
		rowIndex:null,
		postCreate:function(){
			this.inherited(arguments);
			var common = i18n.load("dforma","common");
			if(this.remove){
				domClass.remove(this.buttonNode,"dijitHidden");
				this.removeButton = new Button({
					label:common.buttonRemove,
					"class": this.baseClass+"RemoveButton",
					onClick:lang.hitch(this,function(){
						this.removeItem();
					})
				}).placeAt(this.buttonNode);
			}
		},
		destroyRecursive:function(){
			this.removeButton && this.removeButton.destroy();
			this.inherited(arguments);
		}
	});
	
	return declare("dforma.Repeat",[_ArrayWidgetBase],{
		baseClass:"dformaRepeat",
		_controls:null,
		postCreate:function(){
			this._controls = [];
			this.remove = !this.schema.hasOwnProperty("delete") || this.schema["delete"];
			this.inherited(arguments);
		},
		addControl:function(Widget,params){
	 		this._controls.push({
	 			Widget:Widget,
	 			params:params
	 		});
	 	},
	 	_getValueAttr:function(){
	 		if(!this.widget) return this.inherited(arguments);
	 		var data = this.widget._rows.map(function(row){
	 			return registry.byId(row.id).get("value");
	 		});
	 		this.store.setData(data);
	 		return this.inherited(arguments);
	 	},
	 	isFocusable:function(){
	 		return false;
	 	},
	 	attachWidget:function(){
	 		var self = this;
	 		var Widget = declare([OnDemandList,DijitRegistry],{
				renderRow:function(object, options){
					var id = this.id+ '-row-' + this.collection.getIdentity(object);
			 		var row = new Row({
			 			id:id,
			 			remove:self.remove,
			 			rowIndex:object.id,
			 			removeItem:function(){
			 				var l = self.store.data.length;
			 				if(self.schema.hasOwnProperty("minItems") && l==self.schema.minItems) return;
			 				self.store.remove(this.rowIndex);
			 			}
			 		});
			 		array.forEach(self._controls,function(_){
						_.params.row = row;
						var widget = new _.Widget(_.params);
						row.addChild(widget);
					});
			 		row.startup();
			 		row.set("value",object);
			 		return row.domNode;
				},
				removeRow:function(rowElement){
					var w = registry.byNode(rowElement);
					w.destroyRecursive();
					delete w;
					this.inherited(arguments);
				}
			});
			this.widget = new Widget({
				showFooter:this.add,
				collection:this.store,
				selectionMode:"single"
			});
			this.addChild(this.widget);
			this.addButton && this.addButton.placeAt(this.widget.footerNode);
			if(!this.schema.hasOwnProperty("minItems") || this.schema.minItems>0){
				if(!this.store.data.length) this.store.put(lang.clone(this.defaultInstance));
			}
			this.widget.resize();
	 	},
	 	addItem:function(){
			this.store.add(lang.clone(this.defaultInstance));
		}
	});
});