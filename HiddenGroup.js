define([
    	"dojo/_base/declare",
    	"dojo/_base/lang",
    	"dojo/dom-attr",
    	"dojo/dom-class",
    	"./Group"
    ],function(declare,lang,domAttr,domClass,Group){

	return declare("dforma.HiddenGroup",[Group],{
		_setLabelAttr:function(){
		},
		isHidden:function(){
			return domClass.contains(this.containerNode,"dijitHidden");
		},
		validate:function(){
			if(this.isHidden()) return true;
			this.inherited(arguments);
		},
		postCreate:function(){
			this.inherited(arguments);
			domAttr.set(this.domNode,"hidden",false);
			domClass.toggle(this.labelNode,"dijitHidden",true);
			domClass.toggle(this.buttonNode,"dijitHidden",false);
			domClass.toggle(this.containerNode,"dijitHidden",true);
		}
	});
});