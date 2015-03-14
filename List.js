define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-class",
	"dojo/request",
	"dojo/sniff",
	"dijit/_WidgetBase",
	"dgrid/OnDemandList",
	"dgrid/Keyboard",
	"dgrid/Selection",
	"dgrid/Editor",
	"dgrid/extensions/DijitRegistry",
	"./_ArrayWidgetBase",
	"./util/i18n",
	"mustache/mustache"
],function(declare,lang,array,domClass,request,sniff,
		_WidgetBase, 
		OnDemandList, Keyboard, Selection, Editor, DijitRegistry,
		_ArrayWidgetBase,i18n,
		mustache){
	
	var isIE = !!sniff("ie");
	
	var ListItem = declare("dforma.ListItem",[_WidgetBase],{
		template:"",
		tokens:null,
		value:null,
		writer:null,
		startup:function(){
			if(this._started) return;
			this._createContext();
			this.render();
		},
		_setValueAttr:function(value){
			this.value = value;
			this._createContext();
			this.render();
		},
		_createContext:function(obj){
			this.context = new mustache.Context(this.value);
		},
		render:function(){
			if(!this.writer) return;
			this.domNode.innerHTML = this.writer.renderTokens(this.tokens,this.context,{},this.template);
			// IE style workaround
			if(isIE) {
				query("*[data-style]",this.domNode).forEach(function(_){
					domAttr.set(_,"style",domAttr.get(_,"data-style"));
				});
			}
		}
	});
	
	return declare("dforma.List",[_ArrayWidgetBase],{
		baseClass:"dformaList",
	 	attachWidget:function(){
	 		var self = this;
	 		var Widget = declare([OnDemandList, Keyboard, Selection, Editor, DijitRegistry],{
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
				 				self.widget.select(w.value.id);
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
				showFooter:this.add,
				collection:this.store,
				selectionMode:"single"
			};
			this.widget = new Widget(listParams);
			this.addChild(this.widget);
			this.addButton && this.addButton.placeAt(this.widget.footerNode);
	 	},
		onAdd:function(id){
			// override to set initial data
		},
		addItem:function(){
			this.store.add(lang.clone(this.defaultInstance)).then(lang.hitch(this,function(data){
				var id = data.id;
				this.onAdd(id);
				this.newdata = true;
				this.widget.select(id);
				this.onEdit(id);
			}));
		},
		onEdit:function(id,options){
			// override to edit
		},
		save:function(obj,options){
			this.newdata = false;
			this.store.put(obj,options);
			this.widget.refresh();
		},
		editSelected:function(){
			if(this.widget.selection.length>1) return; 
			for(var id in this.widget.selection) {
				if(this.widget.selection[id]) {
					this.onEdit(id,{
						overwrite:true
					});
				}
			}
		},
		removeSelected:function(){
			for(var id in this.widget.selection) {
				if(this.widget.selection[id]) this.store.remove(id);
			}
			this.widget.refresh();
		}
	});
});