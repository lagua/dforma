define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dijit/_WidgetBase",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_TemplatedMixin",
	"dijit/form/Button",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"dojox/mobile/i18n"
],function(declare,lang,array,domConstruct,domClass,_WidgetBase,_Contained,_Container,_TemplatedMixin,Button,OnDemandGrid,Selection,DijitRegistry,i18n){
	
	return declare("dforma.List",[_WidgetBase,_Contained,_Container,_TemplatedMixin],{
		templateString: "<div class=\"dijit dijitReset\" data-dojo-attach-point=\"focusNode\" aria-labelledby=\"${id}_label\"><div class=\"dijitReset dijitHidden dformaListLabel\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></div><div class=\"dijitReset dijitHidden dformaListHint\" data-dojo-attach-point=\"hintNode\"></div><div data-dojo-attach-point=\"containerNode\"></div><div class=\"dijitReset dijitHidden dformaListMessage\" data-dojo-attach-point=\"messageNode\"></div></div>",
		store:null,
		defaultInstance:{},
		_setHintAttr: function(/*String*/ content){
			// summary:
			//		Hook for set('label', ...) to work.
			// description:
			//		Set the label (text) of the button; takes an HTML string.
			this._set("hint", content);
			this.hintNode.innerHTML = content;
			domClass.toggle(this.hintNode,"dijitHidden",!this.hint);
	 	},
		_setLabelAttr: function(/*String*/ content){
			// summary:
			//		Hook for set('label', ...) to work.
			// description:
			//		Set the label (text) of the button; takes an HTML string.
			this._set("label", content);
			this["labelNode"].innerHTML = content;
			domClass.toggle(this.labelNode,"dijitHidden",!this.label);
	 	},
	 	postCreate:function(){
			var common = i18n.load("dforma","common");
			var self = this;
			var Widget = declare([OnDemandGrid,Selection,DijitRegistry],{
				selectionMode:"single",
				showFooter:true,
	 		});
			this.grid = new Widget(this.params);
			this.addChild(this.grid);
			this.addButton = new Button({
				label:common.buttonAdd,
				"class": "dformaListEditButton",
				onClick:function(){
					self.add();
				}
			}).placeAt(this.grid.footerNode);
			this.editButton = new Button({
				label:common.buttonEditSelected,
				disabled:true,
				"class": "dformaListEditButton",
				onClick:function(){
					self.editSelected();
				}
			}).placeAt(this.grid.footerNode);
			this.removeButton = new Button({
				label:common.buttonRemoveSelected,
				disabled:true,
				"class": "dformaListRemoveButton",
				onClick:function(){
					self.removeSelected();
				}
			}).placeAt(this.grid.footerNode);
			this.inherited(arguments);
	 	},
		startup:function(){
			this.inherited(arguments);
			var self = this;
			var selected = 0;
			this.own(
				this.grid.on("dgrid-select", function(e){
					selected += e.rows.length;
					self.editButton.set("disabled", !selected);
					self.removeButton.set("disabled", !selected);
				}),
				this.grid.on("dgrid-deselect", function(e){
					selected -= e.rows.length;
					self.editButton.set("disabled", !selected);
					self.removeButton.set("disabled", !selected);
				})
			);
		},
		add:function(){
			// override to set initial data
			var id = this.store.add(lang.clone(this.defaultInstance));
			this.grid.select(id);
			this.onEdit(id);
		},
		onEdit:function(id,options){
			// override to edit
		},
		save:function(id,options){
			this.store.put(id,options);
		},
		editSelected:function(){
			for(var id in this.grid.selection) {
				if(this.grid.selection[id]) this.onEdit(id,{
					overwrite:true
				});
			}
		},
		removeSelected:function(){
			for(var id in this.grid.selection) {
				if(this.grid.selection[id]) this.store.remove(id);
			}
		}
	});
});