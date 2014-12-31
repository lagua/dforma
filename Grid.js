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
	"dijit/form/_FormValueMixin",
	"dijit/form/Button",
	"dstore/Memory",
	"dgrid/OnDemandGrid",
	"dgrid/Editor",
	"dgrid/Keyboard",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"dforma/util/i18n"
],function(declare,lang,array,domConstruct,domClass,
		_WidgetBase,_Contained,_Container,_TemplatedMixin, _FormValueMixin, Button, Memory,
		OnDemandGrid, Keyboard, Selection, Editor, DijitRegistry,i18n){
	
	return declare("dforma.Grid",[_WidgetBase,_Contained,_Container,_TemplatedMixin, _FormValueMixin],{
		templateString: "<div class=\"dijit dijitReset\" data-dojo-attach-point=\"focusNode\" aria-labelledby=\"${id}_label\"><div class=\"dijitReset dijitHidden dformaGridLabel\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></div><div class=\"dijitReset dijitHidden dformaGridHint\" data-dojo-attach-point=\"hintNode\"></div><div class=\"dformaGridContainer\" data-dojo-attach-point=\"containerNode\"></div><div class=\"dijitReset dijitHidden dformaGridMessage\" data-dojo-attach-point=\"messageNode\"></div></div>",
		store:null,
		newdata:false,
		defaultInstance:{},
		add:true,
		edit:true,
		remove:true,
		readOnly:false,
		baseClass:"dformaGrid",
		multiple:true, // needed for setValueAttr array value
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
	 	_getValueAttr:function(){
	 		this.grid.save();
	 		return this.store.fetchSync();
	 	},
	 	_setValueAttr:function(data){
	 		data = data || [];
	 		// TODO means we have a Memory type store?
	 		this.store.setData(data);
	 		this.grid.refresh();
	 	},
	 	destroyRecursive:function(){
	 		this.inherited(arguments);
	 		this.addButton && this.addButton.destroyRecursive();
	 		this.editButton && this.editButton.destroyRecursive();
	 		this.removeButton && this.removeButton.destroyRecursive();
	 	},
	 	postCreate:function(){
			var common = i18n.load("dforma","common");
			var self = this;
			if(!this.store) this.store = new Memory();
			var Widget = declare([OnDemandGrid, Keyboard, Selection, Editor, DijitRegistry],{
				collection:this.store,
				selectionMode:"single",
				showFooter:(this.add || this.edit || this.remove)
	 		});
			this.grid = new Widget(this.params);
			this.addChild(this.grid);
			if(this.add){
				this.addButton = new Button({
					label:common.buttonAdd,
					disabled:this.readOnly,
					"class": "dformaGridAddButton",
					onClick:function(){
						self._add();
					}
				}).placeAt(this.grid.footerNode);
			}
			if(this.edit){
				this.editButton = new Button({
					label:common.buttonEditSelected,
					disabled:true,
					"class": "dformaGridEditButton",
					onClick:function(){
						self.editSelected();
					}
				}).placeAt(this.grid.footerNode);
			}
			if(this.remove){
				this.removeButton = new Button({
					label:common.buttonRemoveSelected,
					disabled:true,
					"class": "dformaGridRemoveButton",
					onClick:function(){
						self.removeSelected();
					}
				}).placeAt(this.grid.footerNode);
			}
			this.inherited(arguments);
	 	},
		startup:function(){
			this.inherited(arguments);
			var self = this;
			var selected = 0;
			this.own(
				this.grid.on("dgrid-select", function(e){
					selected += e.rows.length;
					if(self.edit && !self.readonly) self.editButton.set("disabled", !selected);
					if(self.remove) self.removeButton.set("disabled", !selected);
				}),
				this.grid.on("dgrid-deselect", function(e){
					selected -= e.rows.length;
					if(self.edit && !self.readonly) self.editButton.set("disabled", !selected);
					if(self.remove) self.removeButton.set("disabled", !selected);
				})
			);
		},
		onAdd:function(id){
			// override to set initial data
		},
		_add:function(){
			this.store.add(lang.clone(this.defaultInstance)).then(lang.hitch(this,function(data){
				var id = data.id;
				this.onAdd(id);
				this.newdata = true;
				this.grid.select(id);
				this.onEdit(id);
			}));
		},
		onEdit:function(id,options){
			// override to edit
		},
		save:function(id,options){
			this.newdata = false;
			this.store.put(id,options);
			this.grid.refresh();
		},
		editSelected:function(){
			if(this.grid.selection.length>1) return; 
			for(var id in this.grid.selection) {
				if(this.grid.selection[id]) {
					this.onEdit(id,{
						overwrite:true
					});
				}
			}
		},
		removeSelected:function(){
			for(var id in this.grid.selection) {
				if(this.grid.selection[id]) this.store.remove(id);
			}
			this.grid.refresh();
		}
	});
});