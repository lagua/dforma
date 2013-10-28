define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/dom-construct",
        "dijit/form/_FormValueWidget",
        "dijit/form/RadioButton",
    ], function (declare, lang, array, domConstruct, _FormValueWidget,RadioButton) {

    return declare("dforma.RadioGroup",[_FormValueWidget], {
    	options:null,
    	labelAttr:"label",
    	baseClass:"dformaRadioGroup",
    	templateString:"<div data-dojo-attach-point=\"containerNode,focusNode\"></div>",
    	buildRendering:function(){
    		this.inherited(arguments);
    		array.forEach(this.options,function(_){
    			new RadioButton(lang.mixin(_,{
    				checked:_.value==this.value
    			})).placeAt(this.containerNode);
    			domConstruct.create("label",{
    				"for":_.id,
    				innerHTML:_[this.labelAttr]
    			},this.containerNode);
    		},this);
    	},
        _getValueAttr : function() {
            var selectedRadio = this.getChildren().filter(function(w){
                return w.get("checked");
            }).pop();
            return selectedRadio.get("value");
        }
    });
});