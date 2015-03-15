define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class"
],function(declare,lang,domClass){
return declare("dforma._GroupMixin",[],{
	hint:"",
	label: "",
	message:"",
	startup:function(){
		this.inherited(arguments);
		domClass.toggle(this.labelNode,"dijitHidden",!this.label);
		domClass.toggle(this.messageNode,"dijitHidden",!this.message);
	},
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
 	_setMessageAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this._set("message", content);
		this["messageNode"].innerHTML = content;
		domClass.toggle(this.messageNode,"dijitHidden",!this.message);
 	},
	_onFocus: function(){
		// override to cancel early validation
	}
});

});