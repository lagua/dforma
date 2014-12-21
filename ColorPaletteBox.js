define([
	"require",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dforma/_DropDownBox"
], function(req,declare,lang,_DropDownBox) {

	return declare("dforma.ColorPaletteBox", _DropDownBox,{
		baseClass: "dijitTextBox dijitComboBox dformaColorPaletteBox",
		dropDownDefaultValue : "#ffffff",
		value: "#ffffff",
		palette:"7x10",
		customColors:null,
		customTitles:null,
		postMixInProperties:function(){
			var self = this,args = arguments;
			req(["dlagua/w/ColorPalette"],function(ColorPalette){ 
				self.popupClass = ColorPalette;
				self.inherited(args);
			});
		},
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
