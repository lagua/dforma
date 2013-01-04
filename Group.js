/*
simple grouping panel for form elements
*/
dojo.provide("dforma.Group");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");
dojo.require("dijit._Contained");

dojo.declare("dforma.Group",[dijit._Widget,dijit._Templated,dijit._Container,dijit._Contained],{
	templateString: "<div class=\"dijit dijitReset dformaGroup\" aria-labelledby=\"${id}_label\"><span style=\"display:none\" class=\"dijitReset dijitInline dformaGroupLabel\" dojoAttachPoint=\"labelNode\" id=\"${id}_label\"></span><span id=\"${id}_containerNode\" dojoAttachPoint=\"containerNode\"></span></div>",
	label: "",
	startup:function(){
		if(this.label) dojo.style(this.id+"_label","display","inline-block");
		this.inherited(arguments);
	},
	_setLabelAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this._set("label", content);
		this["labelNode"].innerHTML = content;
 	}
});