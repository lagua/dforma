define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dijit/_WidgetBase",
	"dijit/_Contained",
	"dijit/form/Button",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dojox/mobile/i18n"
],function(declare,lang,array,_WidgetBase,_Contained,Button,OnDemandGrid,Selection,i18n){
	
	return declare("dforma.List",[_WidgetBase,_Contained,OnDemandGrid,Selection],{
		store:null,
		selectionMode:"single",
		showFooter:true,
		defaultInstance:{},
		startup:function(){
			this.inherited(arguments);
			var self = this;
			var common = i18n.load("dforma","common");
			this.addButton = new Button({
				label:common.buttonAdd,
				"class": "dformaListEditButton",
				onClick:function(){
					self.add();
				}
			}).placeAt(this.footerNode);
			this.editButton = new Button({
				label:common.buttonEditSelected,
				disabled:true,
				"class": "dformaListEditButton",
				onClick:function(){
					self.editSelected();
				}
			}).placeAt(this.footerNode);
			this.removeButton = new Button({
				label:common.buttonRemoveSelected,
				disabled:true,
				"class": "dformaListRemoveButton",
				onClick:function(){
					self.removeSelected();
				}
			}).placeAt(this.footerNode);
			var selected = 0;
			this.own(
				this.on("dgrid-select", function(e){
					selected += e.rows.length;
					self.editButton.set("disabled", !selected);
					self.removeButton.set("disabled", !selected);
				}),
				this.on("dgrid-deselect", function(e){
					selected -= e.rows.length;
					self.editButton.set("disabled", !selected);
					self.removeButton.set("disabled", !selected);
				})
			);
		},
		add:function(){
			// override to set initial data
			var id = this.store.add(lang.clone(this.defaultInstance));
			this.select(id);
			this.onEdit(id);
		},
		onEdit:function(id,options){
			// override to edit
		},
		save:function(id,options){
			this.store.put(id,options);
		},
		editSelected:function(){
			for(var id in this.selection) {
				if(this.selection[id]) this.onEdit(id,{
					overwrite:true
				});
			}
		},
		removeSelected:function(){
			for(var id in this.selection) {
				if(this.selection[id]) this.store.remove(id);
			}
		}
	});
});
