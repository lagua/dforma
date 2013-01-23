define(["dojo/_base/declare", "dlagua/w/ColorPalette", "dforma/_DropDownBox"], function(declare, ColorPalette,_DropDownBox) {

	return declare("dforma.ColorPaletteBox", _DropDownBox,{
		baseClass: "dijitTextBox dijitComboBox dformaColorPaletteBox",
		dropDownDefaultValue : "#ffffff",
		value: "#ffffff",
		palette:"7x10",
		customColors:null,
		customTitles:null,
		popupClass: ColorPalette, // default is no popup = text only
		buildRendering:function(){
			this.popupProps = {
				palette:this.palette,
				customColors:this.customColors,
				customTitles:this.customTitles
			};
			this.inherited(arguments);
		}
	});


});
