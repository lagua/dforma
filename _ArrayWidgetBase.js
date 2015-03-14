define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/request",
	"dojo/aspect",
	"dijit/_WidgetBase",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_TemplatedMixin",
	"dijit/form/_FormValueMixin",
	"dijit/form/Button",
	"dforma/store/FormData",
	"dforma/util/i18n",
	"mustache/mustache",
	"dojo/text!./templates/_ArrayWidgetBase.html"
],function(declare,lang,domClass,request,aspect,
		_WidgetBase,_Contained,_Container,_TemplatedMixin, _FormValueMixin, Button, 
		FormData,i18n,
		mustache,
		templateString){
	
	return declare([_WidgetBase,_Contained,_Container,_TemplatedMixin, _FormValueMixin],{
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
	 		return this.store.fetchSync();
	 	},
	 	_handleOnChange:function(data){
	 		this.inherited(arguments);
	 		data = data || [];
	 		// TODO means we have a Memory type store?
	 		data.forEach(function(obj){
	 			this.store.put(obj);
	 		},this);
	 	},
	 	destroyRecursive:function(){
	 		this.inherited(arguments);
	 		this.addButton && this.addButton.destroyRecursive();
	 		this.editButton && this.editButton.destroyRecursive();
	 		this.removeButton && this.removeButton.destroyRecursive();
	 	},
	 	postCreate:function(){
			var self = this;
			if(!this.store) this.store = new FormData({
				local:true
			});
			var common = i18n.load("dforma","common");
			if(this.add){
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
			request(this.templatePath+this.templateExtension).then(lang.hitch(this,function(tpl){
				if(tpl) {
					this.template = tpl;
					if(!this.writer) {
						this.writer = new mustache.Writer();
						this.tokens = this.writer.parse(tpl);
					}
				}
				this.attachWidget();
			}),lang.hitch(this,function(err){
				// also attach widget if no template
				this.attachWidget();
			}));
			this.inherited(arguments);
		},
		attachWidget:function(){
			// override
		}
	});
});