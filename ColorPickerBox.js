define(["dojo/_base/declare", "dojox/widget/ColorPicker", "dforma/_DropDownBox"], function(declare, ColorPicker,_DropDownBox) {

return declare("dforma.ColorPickerBox",	_DropDownBox,{
	baseClass: "dijitTextBox dijitComboBox dformaColorPickerBox",
	dropDownDefaultValue : "#ffffff",
	value: "#ffffff",
	popupClass: ColorPicker, // default is no popup = text only
});

});
