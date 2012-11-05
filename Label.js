dojo.provide("dforma.Label");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");
dojo.require("dijit._Contained");

dojo.declare("dforma.Label",[dijit._Widget,dijit._Templated,dijit._Container,dijit._Contained],{
	templateString: "<span class=\"dijit dijitReset dijitInline\" aria-labelledby=\"${id}_label_${position}\"><span style=\"display:none\" class=\"dijitReset dijitInline dijitButtonText dformaLabel\" dojoAttachPoint=\"labelNode_left\" id=\"${id}_label_left\"></span><span id=\"${id}_containerNode\" dojoAttachPoint=\"containerNode\"></span><span dojoAttachPoint=\"labelNode_right\" style=\"display:none\" class=\"dijitReset dijitInline dijitButtonText dformaLabel\" id=\"${id}_label_right\"></span></span>",
	label: "",
	position: "left",
	child: null,
	baseClass: "formLabel",
	destroyRecursive:function(preserveDom) {
		if(this.child) this.child.destroyRecursive(preserveDom);
		this.inherited(arguments);
	},
 	startup: function(){
		dojo.style(this.id+"_label_"+this.position,"display","inline-block");
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
