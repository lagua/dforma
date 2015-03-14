/*
simple grouping panel for form elements
*/
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dgrid/OnDemandGrid",
	"dgrid/extensions/OnDemandGrid",
	"./_ArrayWidgetBase",
	"./Group",
	"./util/i18n",
	"dijit/form/Button",
	"dojo/text!./templates/List.html"
],function(declare,lang,array,domConstruct,
		OnDemandGrid,OnDemandGrid,
		Group,_ArrayWidgetBase,i18n,
		Button,templateString){
	
	return declare("dforma.Repeat",[],{
		baseClass:"dformaRepeat",
		templateString: templateString,
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
	 		var Widget = declare([OnDemandGrid, DijitRegistry]{
				renderRow:lang.hitch(this,function(object, options){
			 		var child = new ListItem({
			 			value:object,
			 			writer:this.writer,
			 			tokens:this.tokens,
			 			template:this.template
			 		});
			 		child.own(
			 			child.on("click",function(){
			 				var w = registry.getEnclosingWidget(this);
				 			if(w && w.value) {
				 				self.list.select(w.value.id);
				 				self.onEdit(w.value.id);
				 			}
				 		})
			 		);
			 		child.startup();
			 		return child.domNode;
				}),
				removeRow:function(rowElement){
					this.inherited(arguments);
				}
			});
			var listParams = {
				showFooter:(this.add || this.edit),
				collection:this.store,
				selectionMode:"single"
			};
			this.list = new Widget(listParams);
			this.addChild(this.list);
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