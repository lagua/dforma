define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/dom-construct",
        "dijit/form/_FormValueWidget",
        "dijit/form/RadioButton"
    ], function (declare, lang, array, domConstruct, _FormValueWidget,RadioButton) {

    return declare("dforma.RadioGroup",[_FormValueWidget], {
    	options:null,
    	labelAttr:"label",
    	baseClass:"dformaRadioGroup",
    	templateString:"<div data-dojo-attach-point=\"containerNode,focusNode\"></div>",
		_renderOptions:function(){
			array.forEach(this.options,function(_,i){
    			new RadioButton(lang.mixin(_,{
    				checked:this.value ? _.id==this.value : i===0
    			})).placeAt(this.containerNode);
    			domConstruct.create("label",{
    				"for":_.id,
    				innerHTML:_[this.labelAttr]
    			},this.containerNode);
    		},this);
		},
    	buildRendering:function(){
    		this.inherited(arguments);
    		if(this.store && !this.options) {
				this.store.query({},{
					count:50
				}).then(lang.hitch(this,function(res){
					this.options = res;
					this._renderOptions();
				}));
			} else {
				this._renderOptions();
			}
    	},
    	validate:function(){
    		// TODO signal empty selection?
    		if(this.required) {
	    		var selectedRadio = this.getChildren().filter(function(w){
	                return w.get("checked");
	            });
	    		return selectedRadio.length>0;
    		} else {
    			return true;
    		}
		},
        _getValueAttr : function() {
            var selectedRadio = this.getChildren().filter(function(w){
                return w.get("checked");
            }).pop();
            return selectedRadio ? selectedRadio.id : null;
        }
    });
});