define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/aspect",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/form/Button",
	"./_FormValueWidget",
	"./_TemplatedMixin",
	"./store/FormData",
	"./util/i18n",
	"dojo/text!./templates/_ArrayWidgetBase.html"
],function(declare,lang,domClass,aspect,
		_Contained,_Container, Button, 
		_FormValueWidget,_TemplatedMixin,FormData,i18n,
		templateString){
	
	return declare("dforma._ArrayWidgetMixin",[_FormValueWidget,_TemplatedMixin,_Contained,_Container],{
		store:null,
		newdata:false,
		defaultInstance:{},
		add:true,
		edit:true,
		remove:true,
		readOnly:false,
		templateString:templateString,
		baseClass:"",
		templatePath:"",
		templateExtension:"",
		multiple:true, // needed for setValueAttr array value
		_setHintAttr: function(/*String*/ content){
			// summary:
			//		Hook for set('hint', ...) to work.
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
	 		var idProp = this.store.idProperty || "id";
	 		return this.store.fetchSync().map(function(_){
	 			var obj = lang.mixin({},_);
	 			delete obj[idProp];
	 			return obj;
	 		});
	 	},
	 	_setValueAttr:function(data){
	 		this.inherited(arguments);
	 		data = data || [];
	 		var idProp = this.store.idProperty || "id";
	 		var ids = data.map(function(_){
	 			return data[idProp];
	 		});
	 		this.store.fetchSync().forEach(function(_){
	 			var id = _[idProp];
	 			if(ids.indexOf(id)==-1){
	 				this.store.remove(id);
	 			} 
	 		},this);
	 		// TODO means we have a Memory type store?
	 		data.forEach(function(obj){
	 			this.store.put(obj);
	 		},this);
	 	},
	 	destroyRecursive:function(){
	 		this.inherited(arguments);
	 		this.addButton && this.addButton.destroy();
	 		this.editButton && this.editButton.destroy();
	 		this.removeButton && this.removeButton.destroy();
	 	},
	 	postCreate:function(){
			var self = this;
			if(!this.store) this.store = new FormData({
				local:true
			});
			if(!this.schema) this.schema = {};
			var common = i18n.load("dforma","common");
			if((!this.schema.hasOwnProperty("add") && this.add) || this.schema.add) {
				this.addButton = new Button({
					label:common.buttonAdd+(this.label ? " "+this.label : ""),
					disabled:this.readOnly,
					"class": this.baseClass+"AddButton",
					onClick:function(){
						self.addItem();
					}
				});
			}
			this.own(
				this.store.on("add, update, delete", lang.hitch(this,function(event){
					this._set("value",this.store.fetchSync());
				}))
			);
			if(this.subform){
				this.own(
					aspect.after(this.subform,"cancel",lang.hitch(this,function(){
						this.selected = null;
						this.refresh();
					})),
					this.subform.watch("value",lang.hitch(this,function(prop,oldVal,newVal){
						if(this.autosave && this.newdata) {
							this.newdata = false;
						}
						this.store.put(newVal);
					}))
				);
			}
			this.inherited(arguments);
		},
		onTemplate:function(){
			this.attachWidget();
		},
		attachWidget:function(){
			// override
		}
	});
});