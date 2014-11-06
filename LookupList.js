define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/store/Memory",
	"dojo/store/Observable",
	"dojox/mobile/i18n",
	"dijit/form/_FormValueWidget",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_TemplatedMixin",
	"dgrid/OnDemandGrid",
	"dgrid/Selection",
	"dgrid/extensions/DnD",
	"dgrid/extensions/DijitRegistry",
	"dijit/form/Button",
	"dijit/form/FilteringSelect"],function(declare,lang,array,domConstruct,domClass,Memory,Observable,i18n,_FormValueWidget,_Contained,_Container,_TemplatedMixin,OnDemandGrid,Selection,DnD,DijitRegistry,Button,FilteringSelect){
	
	return declare("dforma.LookupList",[_FormValueWidget,_Contained,_Container,_TemplatedMixin],{
		templateString: "<div class=\"dijit dijitReset\" data-dojo-attach-point=\"focusNode\" aria-labelledby=\"${id}_label\"><div class=\"dijitReset dijitHidden dformaListHint\" data-dojo-attach-point=\"hintNode\"></div><div data-dojo-attach-point=\"containerNode\"></div><div class=\"dijitReset dijitHidden dformaListMessage\" data-dojo-attach-point=\"messageNode\"></div></div>",
		store:null,
		_setHintAttr: function(/*String*/ content){
			// summary:
			//		Hook for set('label', ...) to work.
			// description:
			//		Set the label (text) of the button; takes an HTML string.
			this._set("hint", content);
			this.hintNode.innerHTML = content;
			domClass.toggle(this.hintNode,"dijitHidden",!this.hint);
	 	},
	 	destroyRecursive:function(){
	 		this.select.destroyRecursive();
	 		this.addButton.destroyRecursive();
	 		this.grid.destroy();
	 		this.inherited(arguments);
	 	},
	 	_getValueAttr:function(){
	 		return this.store.query({__selected:true}).map(function(_) {
	 			return _.name;
	 		});
	 	},
	 	_setValueAttr:function(val){
	 		val.forEach(function(_){
	 			var item = this.store.query({name:_}).pop();
	 			if(!item) item = {name:_};
	 			item.__selected = true;
				if(!(this.schema["enum"] instanceof Array) || this.schema["enum"].indexOf(_)>0) this.store.put(item);
	 		});
	 	},
	 	postCreate:function(){
	 		// TODO: create 2 mem stores, make them mutually exclusive
			var common = i18n.load("dforma","common");
			var self = this;
			var store = new Memory();
			if(this.schema["enum"] instanceof Array) {
				this.schema["enum"].forEach(function(_) {
					var idx = self.value.indexOf(_);
					store.add({"name":_,__selected:idx>0});
				});
			}
			this.store = new Observable(store);
			var Widget = declare([OnDemandGrid,Selection,DnD,DijitRegistry],{
				columns: {
					summary: {
						field: "name", // get whole item for use by formatter
						label: this.label,
						sortable: true,
						renderCell:function (object, data, cell) {
							cell.appendChild(domConstruct.create("span",{
								"class":"dformaLookupListItemLabel",
								innerHTML:object.name
							}));
							var btnDelete = new Button({
								rowId : object.id,
								label: "Delete",
								onClick: function () {
									var val = self.store.get(this.rowId);
									val.__selected = false;
									self.store.put(val);
								}
							}, cell.appendChild(domConstruct.create("span")));
							btnDelete._destroyOnRemove = true;
	
							return btnDelete;
						}
					}
				}
			});
			this.grid = new Widget({
				sort: "name",
				store: this.store,
				query: {__selected:true},
				showFooter:true
			});
			this.addChild(this.grid);
			this.select = new FilteringSelect({
				store: this.store,
				required: false,
				autocomplete: true,
				query: {__selected:false}
			}).placeAt(this.grid.footerNode);
			this.addButton = new Button({
				label: common.buttonAdd,
				onClick: function(){
					var id = self.select.get("value");
					self.select.set("value",null);
					if(id) {
						var val = self.store.get(id);
						val.__selected = true;
						self.store.put(val);
					}
				}
			}).placeAt(this.grid.footerNode);
			this.inherited(arguments);
	 	}
	});
});
