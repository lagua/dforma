/*
simple grouping panel for form elements
*/
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dgrid/OnDemandList",
	"dgrid/extensions/DijitRegistry",
	"./_ArrayWidgetBase",
	"./Group",
	"./util/i18n",
	"dijit/form/Button"
],function(declare,lang,array,domConstruct,
		OnDemandList,DijitRegistry,
		_ArrayWidgetBase,Group,i18n,
		Button){
	
	return declare("dforma.Repeat",[_ArrayWidgetBase],{
		baseClass:"dformaRepeat",
		_controls:null,
		postCreate:function(){
			this._controls = [];
			this.inherited(arguments);
		},
		addControl:function(Widget,params){
	 		this._controls.push({
	 			Widget:Widget,
	 			params:params
	 		});
	 		if(this._controls.length==this.options[0].controls.length) {
	 			// add first row
	 			if(!this.schema.hasOwnProperty("minItems") || this.schema.minItems>0) this.store.put(this.defaultInstance);
	 		}
	 	},
	 	attachWidget:function(){
	 		var self = this;
	 		var Widget = declare([OnDemandList, DijitRegistry],{
				renderRow:lang.hitch(this,function(object, options){
			 		var row = new Group();
			 		array.forEach(this._controls,function(_){
						// TODO add _setValueAttr
						_.params.row = row;
						var widget = new _.Widget(_.params);
						row.addChild(widget);
					},this);
			 		row.startup();
			 		return row.domNode;
				}),
				removeRow:function(rowElement){
					this.inherited(arguments);
				}
			});
			var listParams = {
				showFooter:this.add,
				collection:this.store,
				selectionMode:"single"
			};
			this.widget = new Widget(listParams);
			this.addChild(this.widget);
			this.addButton && this.addButton.placeAt(this.widget.footerNode);
	 	},
	 	cloneRow:function(){
	 		// add new row
	 		var common = i18n.load("dforma","common");
	 		var row = this._rows.length;
	 		var self = this;
			this._rows.push({
				node:domConstruct.create("tr",{},this.repeatNode),
				controls:[]
			});
			array.forEach(this._controls,function(_){
				// TODO add _setValueAttr
				_.params.row = row;
				var widget = new _.Widget(_.params);
				this.addChild(widget);
			},this);
			var removeNode = domConstruct.create("td",{
	 			"class":"dformaRepeatCol"
	 		},this._rows[row].node);
			if(!this.schema.hasOwnProperty("delete") || this.schema["delete"]) {
				var removeBtn = new Button({
					row:row,
					label:common.buttonRemove,
					onClick:function(){
						self.removeRow(this.row);
					}
				}).placeAt(removeNode);
				this._rows[row].controls.push(removeBtn);
			}
	 	},
	 	removeRow:function(row){
	 		if(this.schema.minItems && this._rows.length==this.schema.minItems) return;
	 		array.forEach(this._rows[row].controls,function(_){
	 			_.destroyRecursive();
	 		});
	 		this.repeatNode.removeChild(this._rows[row].node);
	 		this._rows.splice(row,1);
	 	}
	});
});