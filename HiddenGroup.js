define([
    	"dojo/_base/declare",
    	"dojo/_base/lang",
    	"dojo/dom-class",
    	"./Group"
    ],function(declare,lang,domClass,Group){

	return declare("dforma.HiddenGroup",[Group],{
		_setLabelAttr:function(){
		},
		postCreate:function(){
			this.inherited(arguments);
			domClass.toggle(this.labelNode,"dijitHidden",true);
			domClass.toggle(this.buttonNode,"dijitHidden",false);
			domClass.toggle(this.containerNode,"dijitHidden",true);
		}
	});
});