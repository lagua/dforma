define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/request",
	"dojo/sniff",
	"dgrid/OnDemandList",
	"dgrid/Keyboard",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"./_ArrayWidgetBase"
],function(declare,lang,array,domConstruct,domClass,request,sniff,
		OnDemandList, Keyboard, Selection, DijitRegistry,
		_ArrayWidgetBase){
	
	var isIE = !!sniff("ie");
	
	return declare("dforma.List",[_ArrayWidgetBase],{
		baseClass:"dformaList",
	 	attachWidget:function(){
	 		var self = this;
	 		// FIXME use identity
	 		var Widget = declare([OnDemandList, Keyboard, Selection, DijitRegistry],{
				renderRow:lang.hitch(this,function(object, options){
					var div = domConstruct.create("div",{
						innerHTML:this.renderTemplate(object)
					});
					// IE style workaround
					if(isIE) {
						query("*[data-style]",div).forEach(function(_){
							domAttr.set(_,"style",domAttr.get(_,"data-style"));
						});
					}
			 		return div;
				})
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