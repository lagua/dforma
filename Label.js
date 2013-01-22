define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dijit/_Widget",
	"dijit/_TemplatedMixin",
	"dijit/_Container",
	"dijit/_Contained"
],function(declare,lang,domStyle,_Widget,_TemplatedMixin,_Container,_Contained){
return declare("dforma.Label",[_Widget,_TemplatedMixin,_Container,_Contained],{
	templateString: "<span class=\"dijit dijitReset dijitInline\" aria-labelledby=\"${id}_label_${position}\"><span style=\"display:none\" class=\"dijitReset dijitInline dijitButtonText dformaLabel\" data-dojo-attach-point=\"labelNode_left\" id=\"${id}_label_left\"></span><span id=\"${id}_containerNode\" data-dojo-attach-point=\"containerNode\"></span><span data-dojo-attach-point=\"labelNode_right\" style=\"display:none\" class=\"dijitReset dijitInline dijitButtonText dformaLabel\" id=\"${id}_label_right\"></span></span>",
	label: "",
	position: "left",
	child: null,
	baseClass: "formLabel",
	destroyRecursive:function(preserveDom) {
		if(this.child) this.child.destroyRecursive(preserveDom);
		this.inherited(arguments);
	},
 	startup: function(){
		domStyle.set(this.id+"_label_"+this.position,"display","inline-block");
		if(this.child) this.addChild(this.child);
		this.inherited(arguments);
 	},
	_setLabelAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this._set("label", content);
		this["labelNode_"+this.position].innerHTML = content;
	}
});
});