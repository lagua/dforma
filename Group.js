/*
simple grouping panel for form elements
*/
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dijit/_Widget",
	"dijit/_TemplatedMixin",
	"dijit/_Container",
	"dijit/_Contained"
],function(declare,lang,domStyle,_Widget,_TemplatedMixin,_Container,_Contained){
return declare("dforma.Group",[_Widget,_TemplatedMixin,_Container,_Contained],{
	templateString: "<div class=\"dijit dijitReset dformaGroup\" aria-labelledby=\"${id}_label\"><span style=\"display:none\" class=\"dijitReset dijitInline dformaGroupLabel\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></span><span id=\"${id}_containerNode\" data-dojo-attach-point=\"containerNode\"></span><span id=\"${id}_messageNode\" class=\"dijitReset dformaGroupMessage\" data-dojo-attach-point=\"messageNode\"></span></div>",
	label: "",
	message:"",
	startup:function(){
		if(this.label) domStyle.set(this.id+"_label","display","inline-block");
		this.inherited(arguments);
	},
	_setLabelAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this._set("label", content);
		this["labelNode"].innerHTML = content;
 	},
 	_setMessageAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this._set("message", content);
		this["messageNode"].innerHTML = content;
 	}
});
});