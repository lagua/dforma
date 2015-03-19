define([
	"dojo/_base/declare", 
	"dojo/_base/lang",
	"dojo/keys",
	"dijit/_Container",
	"dijit/form/TextBox",
	"./_FormValueWidget",
	"./MultiSelect"
], function(declare,lang,keys,_Container,TextBox,_FormValueWidget,MultiSelect) {

	return declare("dforma.MultiCombo", [_FormValueWidget,_Container], {
		multiple:true,
		templateString:"<div data-dojo-attach-point=\"containerNode,focusNode\"></div>",
		_setValueAttr:function(val){
			this.inherited(arguments);
			this.select && this.select.set("value",val);
		},
		_getValueAttr:function(){
			var val = this.inherited(arguments);
			if(!this.select) return val;
			return this.select.get("value");
		},
		postCreate:function(){
			var self = this;
			this.select = new MultiSelect({
				value:this.value,
				options:this.options,
				style:"display:block;",
				onChange:function(val){
					self._set("value",val);
				}
			});
			this.addChild(this.select);
			this.input = new TextBox({
				onChange:function(val){
					if(val) self.select.addOption({value:val,label:val,selected:true});
					this.set("value","");
				},
				onBlur:function(){
					this.onChange(this.value);
				},
				onKeyPress:function(e) {
					if(e.charOrCode==keys.ENTER) {
						this.focusNode.blur();
					}
				}
			});
			this.addChild(this.input);
			this.inherited(arguments);
		}
	});

});