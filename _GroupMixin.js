define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/on",
	"dojo/aspect",
	"dforma/store/FormData"
],function(declare,lang,domClass,on,aspect,FormData){
return declare("dforma._GroupMixin",[],{
	hint:"",
	label: "",
	message:"",
	startup:function(){
		this.inherited(arguments);
		domClass.toggle(this.labelNode,"dijitHidden",!this.label);
		domClass.toggle(this.messageNode,"dijitHidden",!this.message);
	},
	_setHintAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this._set("hint", content);
		this.hintNode.innerHTML = content;
		domClass.toggle(this.hintNode,"dijitHidden",!this.hint);
 	},
	_setLabelAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this._set("label", content);
		this["labelNode"].innerHTML = content;
		domClass.toggle(this.labelNode,"dijitHidden",!this.label);
 	},
 	_setMessageAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this._set("message", content);
		this["messageNode"].innerHTML = content;
		domClass.toggle(this.messageNode,"dijitHidden",!this.message);
 	},
	_onFocus: function(){
		// override to cancel early validation
	},
	controlModuleMapper:function(c){
		var req;
		switch(c.type) {
			case "date":
				req = "dijit/form/DateTextBox";
			break;
			case "datetime":
				req = "dforma/DateTimeTextBox";
			break;
			case "repeat":
				req = "dforma/Repeat";
			break;
			case "lookuplist":
				req = "dforma/LookupList";
			break;
			case "checkbox":
				req = "dijit/form/CheckBox";
			break;
			case "radiogroup":
				req = "dforma/RadioGroup";
			break;
			case "select":
			//	req = "dijit/form/Select";
			//break;
			case "lookup":
				req = "dijit/form/FilteringSelect";
			break;
			case "combo":
				req = "dijit/form/ComboBox";
			break;
			case "textarea":
				req = "dijit/form/Textarea";
			break;
			case "spinner":
				req = "dijit/form/NumberSpinner";
			break;
			case "number":
				if(c.hidden) {
					req = "./Input";
				} else {
					req = "dijit/form/NumberTextBox";
				}
			break;
			case "currency":
				req = "dijit/form/CurrencyTextBox";
			break;
			case "grid":
				req = "dforma/Grid";
			break;
			case "list":
				req = "dforma/List";
			break;
			case "multiselect":
			case "multiselect_freekey":
				req = "dforma/MultiCombo";
			break;
			case "hslider":
				req = "dijit/form/HorizontalSlider";
			break;
			case "vslider":
				req = "dijit/form/VerticalSlider";
			break;
			case "colorpicker":
				req = "dforma/ColorPickerBox";
			break;
			case "color":
				req = "dforma/ColorPaletteBox";
			break;
			case "colorpalette":
				req = "dlagua/w/ColorPalette";
			break;
			case "group":
				if(c.hidden) {
					req = "dforma/HiddenGroup";
				} else {
					req = "dforma/Group";
				}
			break;
			case "unhidebutton":
				req = "dijit/form/ToggleButton";
			break;
			case "switch":
			break;
			default:
				if(c.required || c.type=="email" || c.type=="phone" || c.readonly) {
					req = "dijit/form/ValidationTextBox";
				} else {
					req = "dijit/form/TextBox";
				}
			break;
		}
		return req;
	},
	controlWidgetMapper:function(cc,Widget,parent){
		var co = null;
		// prepares widget parameters and returns the actual control widget
		var c = cc._config;
		switch(cc.type) {
			case "checkbox":
				cc.checked = (c.value===true);
				cc.validate = function(){
					if(this.hasOwnProperty("isValid") && this.checked!=this.isValid) {
						alert(this.invalidMessage);
						return false;
					} else {
						return true;
					}
				}
			break;
			case "radiogroup":
				if(!cc.labelAttr) cc.labelAttr = "title";
			break;
			case "currency":
				cc.value = parseInt(c.value,10);
			break;
			case "date":
				cc.constraints = {
					selector:"date"
				}
			break;
			case "textarea":
				cc.block = true;
			break;
			case "list":
			case "grid":
			case "repeat":
				cc.nolabel = true;
				cc.hint = c.description || "";
				if(!cc.store) {
					cc.store = new FormData({
						local:true,
						target:parent && parent.store ? parent.store.target : null,
						schema:cc.schema ? cc.schema.items : null
					});
				}
			break;
			case "group":
				cc.nolabel = true;
				//cc.item = c.options[0];
				cc.hint = c.description || "";
			break;
			case "email":
				cc.validator = dforma.validate.isEmailAddress;
			break;
			case "phone":
				cc.validator = dforma.validate.us.isPhoneNumber;
			break;
			case "unhidebutton":
				var label = cc.label.split("|");
				cc.label = label[0];
				cc.splitLabel = label;
				cc.onClick = function(){
					this.getParent().toggle(!this.checked);
					this.value = this.checked ? "on" : "";
					this.set("label",this.splitLabel[(this.checked ? 1 : 0)]);
				};
			break;
			case "select":
			case "lookup":
			case "combo":
				cc = lang.mixin({
					searchAttr:c.searchAttr ? c.searchAttr :
						cc.storeParams && cc.storeParams.labelProperty ? cc.storeParams.labelProperty : "id",
					autoComplete:true
				},cc);
				if(!cc.store) {
					if(c.options && c.options instanceof Array) {
						cc.store = new FormData({
							local:true,
							refProperty:this.refProperty,
							data:c.options
						});
					} else if(cc.schema && cc.schema.items && cc.schema.items.hasOwnProperty(self.refProperty)) {
						cc.store = new FormData({
							target:cc.schema.items[self.refProperty]
						});
					}
				}
			break;
			case "switch":
			break;
			default:
			break;
		}
		co = new Widget(cc);
		if(cc.type=="select") {
			// this is to disable user input, so it looks more like a select
			co.focusNode.setAttribute("readonly","readonly");
			co.own(
				on(co.domNode, "click", lang.hitch(co,function(evt){
					this._onDropDownMouseDown(evt);
				})),
				aspect.before(co._focusManager,"_onTouchNode",lang.hitch(this,function(){
					this._scrollTop = window.scrollY;
				})),
				aspect.after(co,"onFocus",lang.hitch(this,function(){
					window.scrollTo(0,this._scrollTop);
				}))
			);
		}
		return co;
	}
});

});
