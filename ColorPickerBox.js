define([
	"dojo/_base/declare",
	"dojo/on",
	"dojo/dom-geometry",
	"dojo/dom-style",
	"dijit/form/TextBox",
	"colorpicker/ColorPicker"
], function(declare, on, domGeom, domStyle, TextBox, ColorPicker) {

return declare("dforma.ColorPickerBox",	TextBox,{
	baseClass: "dijitTextBox dformaColorPickerBox",
	cp:null,
	value: "#ffffff",
	destroy:function(){
		if(this.cp && this.cp.domNode.parentNode) this.cp.domNode.parentNode.removeChild(this.cp.domNode);
		delete this.cp;
	},
	startup:function(){
		var self = this;
		this.cp;
		domStyle.set(self.domNode,"backgroundColor",this.value);
		var cm = function(e){
			if(!self.cp) {
				self.cp = new ColorPicker({
					onChange:function(val){
						self.set("value",val);
					}
				},e);
			} else {
				self.cp.init(self.cp.X2RGB(self.value));
				domStyle.set(self.cp.domNode,"display","block");
			}
			var myPos = domGeom.position(self.domNode);
			document.body.appendChild(self.cp.domNode);
			domStyle.set(self.cp.domNode,{
				left:myPos.x+"px",
				top:(myPos.y+myPos.h)+"px",
				zIndex:99999
			});
			self._ch.remove();
			self._ch = on(self.textbox,"click",function(e){
				self._ch.remove();
				if(self.cp) {
					domStyle.set(self.cp.domNode,"display","none");
				}
				self._ch = on(self.textbox,"click",cm)
			})
		}
		this._ch = on(this.textbox,"click",cm);
		this.own(this._ch,this.watch("value",function(prop,oldVal,val){
			console.log(val)
			domStyle.set(this.domNode,"backgroundColor",val);
		}));
	}
});

});
