define([
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.hitch
	"dojo/has",
	"dijit/form/_FormValueWidget"
], function(declare, lang, has,_FormValueWidget){
	// module:
	//		dforma/Input

	return declare("dforma.Input" + (has("dojo-bidi") ? "_NoBidi" : ""), [_FormValueWidget], {
		// summary:
		//		A base class for textbox form inputs
		templateString: '<input class="dijit dijitReset dijitLeft dijitInputField" data-dojo-attach-point="textbox,focusNode" autocomplete="off" type="${type}" ${!nameAttrSetting} />',
		baseClass: "dformaInput"
	});
});