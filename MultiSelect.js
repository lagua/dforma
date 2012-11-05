define("dforma/MultiSelect", ["dojo", "dijit", "dijit/form/MultiSelect"], function(dojo, dijit) {

dojo.declare("dforma.MultiSelect", dijit.form.MultiSelect, {
	options:null,
	labelAttr:"label",
	valueAttr:"value",
	addOption:function(op){
		dojo.create("option",{
			value:op[this.valueAttr],
			innerHTML:op[this.labelAttr],
			selected:op.selected
		},this.containerNode);
	},
	startup:function() {
		dojo.forEach(this.options,function(op){
			this.addOption(op);
		},this);
		this.inherited(arguments);
	}
});

});