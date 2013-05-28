define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dijit/_Widget",
	"dijit/_TemplatedMixin",
	"dijit/_Container",
	"dijit/_Contained"
],function(declare,lang,domClass,_Widget,_TemplatedMixin,_Container,_Contained){
return declare("dforma.Label",[_Widget,_TemplatedMixin,_Container,_Contained],{
	templateString: "<span class=\"dijit dijitReset dijitInline\" aria-labelledby=\"${id}_label_${position}\"><span class=\"dijitReset dijitInline dijitHidden dformaLabelNode\" data-dojo-attach-point=\"labelNode_left\" id=\"${id}_label_left\"></span><span id=\"${id}_containerNode\" data-dojo-attach-point=\"containerNode\"></span><span data-dojo-attach-point=\"labelNode_right\" class=\"dijitReset dijitInline dijitHidden dformaLabelNode\" id=\"${id}_label_right\"></span></span>",
	label: "",
	position: "left",
	child: null,
	baseClass: "dformaLabel",
	destroyRecursive:function(preserveDom) {
		if(this.child) this.child.destroyRecursive(preserveDom);
		this.inherited(arguments);
	},
 	startup: function(){
 		if(this._started){ return; } // prevent double-triggering
		this.inherited(arguments);
		this._started = true;
		domClass.remove(this.id+"_label_"+this.position,"dijitHidden");
		if(this.child) {
			if(this.child.required) domClass.add(this.id+"_label_"+this.position,"dformaRequired");
			if(this.child.block) domClass.add(this.domNode,"dformaBlock");
			this.addChild(this.child);
		}
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