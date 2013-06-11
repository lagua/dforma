define([
    	"dojo/_base/declare",
    	"dojo/_base/lang",
    	"dojo/dom-class",
    	"./_GroupMixin",
    	"dijit/form/_FormValueWidget",
    	"dijit/form/ToggleButton"
    ],function(declare,lang,domClass,_GroupMixin,_FormValueWidget,ToggleButton){

	return declare("dforma.UnhideButton",[_FormValueWidget,_GroupMixin],{
		_setLabelAttr:function(){
		},
		postCreate:function(){
			this.inherited(arguments);
			domClass.toggle(this.labelNode,"dijitHidden",true);
			domClass.toggle(this.buttonNode,"dijitHidden",false);
			domClass.toggle(this.containerNode,"dijitHidden",true);
			var self = this;
			var label = this.label.split("|");
			this.toggleButton = new ToggleButton({
				label:label[0],
				onClick:function(){
					domClass.toggle(self.containerNode,"dijitHidden",!this.checked);
					this.set("label",label[(this.checked ? 1 : 0)]);
				}
			},this.buttonNode);
		}
	});
});