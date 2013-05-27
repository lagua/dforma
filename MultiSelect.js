define([
	"dojo/_base/declare", 
	"dojo/_base/array", 
	"dojo/dom-construct",
	"dijit/form/MultiSelect"
], function(declare,array,domConstruct,MultiSelect) {

	return declare("dforma.MultiSelect", MultiSelect, {
		options:null,
		labelAttr:"label",
		valueAttr:"value",
		templateString: "<select multiple='${multiple}' ${!nameAttrSetting} data-dojo-attach-point='containerNode,focusNode' data-dojo-attach-event='onchange: _onChange'></select>",
		addOption:function(op){
			domConstruct.create("option",{
				value:op[this.valueAttr],
				innerHTML:op[this.labelAttr],
				selected:op.selected
			},this.containerNode);
		},
		removeSelected:function(){
			array.forEach(this.getSelected(),function(op){
				this.containerNode.removeChild(op);
			},this);
		},
		startup:function() {
			array.forEach(this.options,function(op){
				this.addOption(op);
			},this);
			this.inherited(arguments);
		}
	});

});