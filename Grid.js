define([
    "require",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/_base/json",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/request",
	"dojo/currency",
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
	"dforma/util/i18n",
	"mustache/mustache",
	"rql/js-array"
],function(req,declare,lang,array,djson,domConstruct,domClass,request,currency,
		_WidgetBase,_Contained,_Container,_TemplatedMixin, _FormValueMixin, Button, 
		Memory,
		OnDemandGrid, Keyboard, Selection, Editor, DijitRegistry,
		i18n,mustache,rql){
	
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
	 		if(!this.grid) return;
	 		this.grid.save();
	 		return this.store.fetchSync();
	 	},
	 	_setValueAttr:function(data){
	 		if(!this.grid) return;
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
	 	_parseColumns:function(columns) {
	 		var self = this;
			for(k in columns){
				columns[k].key = k;
				if(columns[k].template || columns[k].calc || columns[k].widget || columns[k].currency){
					columns[k].renderCell = lang.hitch(columns[k],function(obj,value,node,options) {
						var div = document.createElement("div");
						if(this.select){
							obj = rql.query("select("+this.select+")",{},[obj]).pop();
						}
						if(this.calc) {
							var keys = Object.keys(obj);
							var values = [];
							for(var k in obj) {
							    values.push(obj[k]);
							}
							var f = new Function(keys,"return "+this.calc);
							value = f.apply(obj,values);
						}
						if(this.widget){
							var parts = this.widget.split("|");
							var mid = parts.shift().replace(/\./g,"/");
							var props = parts.length ? djson.fromJson(parts.shift()) : {};
							props = lang.mixin(props,{
								value:value,
								onChange:lang.hitch(this,function(val){
									obj[this.key] = val;
									self.store.put(obj);
								})
							});
							req([mid],function(Widget){
								var widget = new Widget(props);
								setTimeout(function(){
									div.innerHTML = "";
									widget.placeAt(div);
									widget.startup();
								},10)
							});
						} else if(this.tpl){
							value = mustache.render(this.template,obj);
						} else if(this.template) {
							request(self.templatePath+"_column_"+this.key+self.templateExtension).then(lang.hitch(this,function(tpl){
								this.tpl = tpl;
								div.innerHTML = mustache.render(tpl,obj);
							}));
						} else if(this.currency) {
							value = currency.format(value,this);
						}
						div.innerHTML = value;
						return div;
					})
				}
			}
			return columns;
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
			// parse column expressions:
			this.params.columns = this._parseColumns(lang.mixin({},this.params.columns));
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