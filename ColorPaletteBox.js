define("dforma/ColorPaletteBox", ["dojo", "dijit", "dlagua/w/ColorPalette", "dforma/_DropDownBox"], function(dojo, dijit) {

dojo.declare(
	"dforma.ColorPaletteBox",
	dforma._DropDownBox,
	{
		baseClass: "dijitTextBox dijitComboBox dformaColorPaletteBox",
		dropDownDefaultValue : "#ffffff",
		value: "#ffffff",
		palette:"7x10",
		customColors:null,
		customTitles:null,
		popupClass: "dlagua.w.ColorPalette", // default is no popup = text only
		buildRendering:function(){
			this.popupProps = {
				palette:this.palette,
				customColors:this.customColors,
				customTitles:this.customTitles
			};
			this.inherited(arguments);
		}
	}
);


return dforma.ColorPickerBox;
});
