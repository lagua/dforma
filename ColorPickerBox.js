define("dforma/ColorPickerBox", ["dojo", "dijit", "dojox/widget/ColorPicker", "dforma/_DropDownBox"], function(dojo, dijit) {

dojo.declare(
	"dforma.ColorPickerBox",
	dforma._DropDownBox,
	{
		baseClass: "dijitTextBox dijitComboBox dformaColorPickerBox",
		dropDownDefaultValue : "#ffffff",
		value: "#ffffff",
		popupClass: "dojox.widget.ColorPicker", // default is no popup = text only
	}
);


return dforma.ColorPickerBox;
});
