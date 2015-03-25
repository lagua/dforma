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
	"./_ArrayWidgetBase",
	"./_SubFormMixin"
],function(declare,lang,array,domConstruct,domClass,request,sniff,
		OnDemandList, Keyboard, Selection, DijitRegistry,
		_ArrayWidgetBase,_SubFormMixin){
	
	var isIE = !!sniff("ie");
	
	return declare("dforma.List",[_ArrayWidgetBase,_SubFormMixin],{
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
			this.own(
				this.widget.on("dgrid-select", lang.hitch(this,function(e){
					this.editSelected(e.rows[0].data.id);
				})),
				this.widget.on("dgrid-deselect", lang.hitch(this,function(e){
					this.oldSelection = e.rows[0].data.id;
				}))
			);
			this.widget.resize();
	 	},
		addItem:function(){
			if(!this.subform.submit()) {
				if(this.oldSelection) this.widget.select(this.oldSelection);
				delete this.oldSelection;
				return;
			}
			this.store.add(lang.clone(this.defaultInstance)).then(lang.hitch(this,function(data){
				var id = data.id;
				this.newdata = true;
				this.widget.select(id);
				this.onEdit(id);
			}));
		},
		onEdit:function(id,options){
			// override to edit
			this.inherited(arguments);
		},
		editSelected:function(id){
			if(!this.subform.submit()) {
				if(this.oldSelection) this.widget.select(this.oldSelection);
				delete this.oldSelection;
				return;
			}
			this.onEdit(id,{
				overwrite:true
			});
		},
		removeSelected:function(){
			for(var id in this.widget.selection) {
				if(this.widget.selection[id]) this.store.remove(id);
			}
			this.widget.refresh();
		}
	});
});