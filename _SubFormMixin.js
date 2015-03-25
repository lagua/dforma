define([
	"dojo/_base/declare", // declare
	"dojo/_base/lang",
	"dojo/aspect",
	"dojo/dom-class",
	"./Builder",
	"./jsonschema",
	"./util/i18n"
],function(declare,lang,aspect,domClass,Builder,jsonschema,i18n){
	
	return declare("dforma._SubFormMixin",null,{
		subform:null,
		postCreate:function(){
			this.inherited(arguments);
			var common = i18n.load("dforma","common");
			// create bound subform
			if(this.schema.items){
				var self = this;
				var parent = this.getParent() || this._parent;
				var controls = this.controller ? [jsonschema.schemasToController([this.schema.items],null,{
					selectFirst:true,
					controller:this.controller,
					controlmap:parent.controlmap
				})] : jsonschema.schemaToControls(this.schema.items,null,{
					controlmap:parent.controlmap,
					uri:this.store.target
				});
				this.subform = new parent.BuilderClass({
					//label:this.label,
					data:{
						// TODO: create type for items instanceof array
						controls:controls,
						submit:{
							label:common.buttonSave
						}
					},
					store:this.store,
					cancellable:true,
					cancel: function(){
						try {
							domClass.toggle(self.domNode,"dformaSubformActive",false);
							domClass.toggle(parent.buttonNode,"dformaSubformActive",false);
							domClass.toggle(parent.hintNode,"dformaSubformActive",false);
							domClass.toggle(this.domNode,"dijitHidden",true);
							parent.layout();
						} catch(err) {
							console.error("Subform domClass Error: "+err.description);
						}
						if(!this.data) return;
						// cancelled new?
						if(this.data && this.data.id && self.newdata) self.store.remove(this.data.id);
						this.data.id = null;
						self.newdata = false;
					},
					submit: function(){
						if(!this.validate()) return;
						domClass.toggle(self.domNode,"dformaSubformActive",false);
						domClass.toggle(parent.buttonNode,"dformaSubformActive",false);
						domClass.toggle(parent.hintNode,"dformaSubformActive",false);
						domClass.toggle(this.domNode,"dijitHidden",true);
						parent.layout();
						/*var data = this.get("value");
						// checkboxes
						var columns=c.columns ? c.columns : [];
						array.forEach(columns,function(c){
							var k = c.field;
							if(c.editor=="checkbox" && data[k] instanceof Array) {
								data[k] = data[k][0];
							}
						});
						console.warn(data)
						self.save(data,{
							noop:true,
							overwrite:true
						});*/
						this.reset();
						return true;
					}
				});
				domClass.toggle(this.subform.domNode,"dijitHidden",true);
				this.subform.own(
					aspect.after(this.subform,"layout",lang.hitch(parent,function(){
						this.layout();
					})),
					aspect.after(parent,"cancel",lang.hitch(this.subform,function(){
						this.cancel();
					}))
				);
				this.own(
					aspect.after(this.subform,"cancel",lang.hitch(this,function(){
						this.selected = null;
						this.widget.refresh();
					})),
					this.subform.watch("value",lang.hitch(this,function(prop,oldVal,newVal){
						if(this.autosave && this.newdata) {
							this.newdata = false;
						}
						this.store.put(newVal);
					}))
				);
				parent.addChild(this.subform);
			}
		},
		startup:function(){
			this.inherited(arguments);
			var data = this.store.fetchSync();
			if(data.length) {
				this.onEdit && this.onEdit(data[0].id);
			} else {
				this.store.put(lang.clone(this.defaultInstance)).then(lang.hitch(this,function(obj){
					this.onEdit && this.onEdit(obj.id);
				}));
			}
		},
		onEdit:function(id,options){
			options = options || {};
			var parent = this.getParent() || this._parent;
			this.store.get(id).then(lang.hitch(this,function(data){
				domClass.toggle(this.domNode,"dformaSubformActive",true);
				domClass.toggle(parent.buttonNode,"dformaSubformActive",true);
				domClass.toggle(parent.hintNode,"dformaSubformActive",true);
				domClass.toggle(this.subform.domNode,"dijitHidden",false);
				var items = this.schema.items;
				if(!items) {
					throw new Error("Items were not found on the schema for "+this.name);
				}
				this.subform.set("value",data);
			}));
		}
	});
});