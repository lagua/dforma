define([
    	"dojo/_base/declare",
    	"dojo/_base/lang",
    	"dojo/dom-attr",
    	"dojo/dom-class",
    	"dijit/registry",
    	"./Group"
    ],function(declare,lang,domAttr,domClass,registry,Group){

	return declare("dforma.HiddenGroup",[Group],{
		isHidden:function(){
			return domClass.contains(this.containerNode,"dijitHidden");
		},
		validate:function(){
			if(this.isHidden()) return true;
			return this.inherited(arguments);
		},
		getChildren:function(){
			var children = this.inherited(arguments);
			if(this.buttonNode.firstChild) {
				children.push(registry.byNode(this.buttonNode.firstChild));
			}
			return children;
		},
		toggle:function(hidden){
			domClass.toggle(this.labelNode,"dijitHidden",hidden);
			domClass.toggle(this.containerNode,"dijitHidden",hidden);
		},
		startup:function(){
			this.inherited(arguments);
			domAttr.set(this.domNode,"hidden",false);
			domClass.toggle(this.buttonNode,"dijitHidden",false);
			this.toggle(true);
		}
	});
});