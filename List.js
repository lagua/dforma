define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/request",
	"dojo/sniff",
	"dojo/parser",
	"dgrid/OnDemandList",
	"dgrid/Keyboard",
	"dgrid/Selection",
	"dgrid/extensions/DijitRegistry",
	"./_ArrayWidgetBase",
	"./_SubFormMixin"
],function(declare,lang,array,domConstruct,domClass,request,sniff,parser,
		OnDemandList, Keyboard, Selection, DijitRegistry,
		_ArrayWidgetBase,_SubFormMixin){
	
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
					parser.parse(div);
			 		return div;
				}),
				_singleSelectionHandler: function (event, target) {
					if(self.subform && !self.subform.submit()) {
						return;
					}
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
			this.own(
				this.widget.on("dgrid-select", lang.hitch(this,function(e){
					this.onEdit(e.rows[0].data.id);
				}))
			);
			this.widget.resize();
	 	},
		addItem:function(){
			if(!this.subform.submit()) {
				return;
			}
			this.store.add(lang.clone(this.defaultInstance)).then(lang.hitch(this,function(data){
				var id = data.id;
				this.newdata = true;
				this.widget.clearSelection();
				this.widget.select(id);
			}));
		},
		onEdit:function(id,options){
			// override to edit
			this.inherited(arguments);
		},
		removeSelected:function(){
			for(var id in this.widget.selection) {
				if(this.widget.selection[id]) this.store.remove(id);
			}
			this.widget.refresh();
		}
	});
});