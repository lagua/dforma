define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dforma/util/model"
], function(declare,lang,model) {
	
	return declare("dforma._ModelMixin",null,{
		// summary:
		//		This module manages coercing and resolving data for widgets with object arrays
		_setValueAttr:function(value){
			if(this.schema && this.schema.items) {
				model.coerce(value,this.schema.items,{
					refAttribute:"_ref",
					resolve:true,
					fetch:true
				}).then(lang.hitch(this,function(){
					this.inherited([value]);
				});
			} else {
				this.inherited([value]);
			}
		}
	});
	
});