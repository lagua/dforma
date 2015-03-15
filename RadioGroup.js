define([
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/aspect",
        "dojo/dom-construct",
        "dijit/_Container",
        "./_FormValueWidget",
        "dijit/form/RadioButton"
    ], function (declare, lang, array, aspect, domConstruct, _Container,_FormValueWidget,RadioButton) {

    return declare("dforma.RadioGroup",[_FormValueWidget,_Container], {
    	options:null,
    	labelAttr:"label",
    	baseClass:"dformaRadioGroup",
    	templateString:"<div data-dojo-attach-point=\"containerNode,focusNode\"></div>",
		_renderOptions:function(){
			array.forEach(this.options,function(_,i){
    			var rb = new RadioButton(lang.mixin(_,{
    				checked:this.value ? _.id==this.value : i===0
    			}));
    			this.addChild(rb);
    			var self = this;
    			this.own(
    				aspect.after(rb,"onClick",lang.hitch(rb,function(){
    					self._set("value",this.id);
    				}))
    			);
    			domConstruct.create("label",{
    				"for":_.id,
    				innerHTML:_[this.labelAttr]
    			},this.containerNode);
    		},this);
		},
		_handleOnChange: function(/*anything*/ newValue, /*Boolean?*/ priorityChange){
			array.forEach(this.getChildren(),function(_,i){
    			if(_.checked) _.checked = false;
    			if(_.id==newValue) _.checked = true;
    		});
			this.inherited(arguments);
		},
    	postCreate:function(){
    		this.inherited(arguments);
    		if(this.store && !this.options) {
				this.store.query(null,{
					start:0,
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
		}
    });
});