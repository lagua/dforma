define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dijit/_Container"
],function(declare,lang,domClass,_Container){
return declare("dforma._GroupMixin",[_Container],{
	templateString: "<div class=\"dijit dijitReset\" data-dojo-attach-point=\"focusNode\" aria-labelledby=\"${id}_label\"><div class=\"dijitReset dijitHidden ${baseClass}Label\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></div><div class=\"dijitReset dijitHidden ${baseClass}Hint\" data-dojo-attach-point=\"hintNode\"></div><div data-dojo-attach-point=\"containerNode\"></div><div class=\"dijitReset dijitHidden ${baseClass}Message\" data-dojo-attach-point=\"messageNode\"></div><div class=\"dijitReset dijitHidden ${baseClass}ButtonNode\" data-dojo-attach-point=\"buttonNode\"></div></div>",
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