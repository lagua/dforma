define([
	"dojo/_base/declare", // declare
	"dojo/_base/lang", // lang.getObject
	"./RangeBoundTextBox",
	"../_HasDropDown",
	"dojo/text!dijit/form/templates/DropDownBox.html"
], function(declare, lang, RangeBoundTextBox, _HasDropDown, template){
	var  _DropDownBox = declare("dforma._DropDownBox", [RangeBoundTextBox, _HasDropDown], {
		// summary:
		//		Base class for popup box in (ranged) input
		templateString: template,

		// hasDownArrow: [const] Boolean
		//		Set this textbox to display a down arrow button, to open the drop down list.
		hasDownArrow: true,

		// Set classes like dijitDownArrowButtonHover depending on mouse action over button node
		cssStateNodes: {
			"_buttonNode": "dijitDownArrowButton"
		},

		// flag to _HasDropDown to make drop down Calendar width == <input> width
		autoWidth: true,

		// dropDownDefaultValue: Date
		//		The default value to focus in the popupClass widget when the textbox value is empty.
		dropDownDefaultValue : "",

		value: "",

		_blankValue: null,	// used by filter() when the textbox is blank

		// popupClass: [protected extension] String
		//		Name of the popup widget class used to select a date/time.
		//		Subclasses should specify this.
		popupClass: "", // default is no popup = text only
		
		popupProps: null,

		buildRendering: function(){
			this.inherited(arguments);

			if(!this.hasDownArrow){
				this._buttonNode.style.display = "none";
			}

			// If hasDownArrow is false, we basically just want to treat the whole widget as the
			// button.
			if(!this.hasDownArrow){
				this._buttonNode = this.domNode;
				this.baseClass += " dijitComboBoxOpenOnClick";
			}
		},

		_setValueAttr: function(/*Date|String*/ value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			// summary:
			//		Sets the date on this textbox. Note: value can be a JavaScript Date literal or a string to be parsed.
			this.inherited(arguments);
			if(this.dropDown){
				this.dropDown.set('value', value, false);
			}
		},

		_setDropDownDefaultValueAttr: function(/*Date*/ val){
			this.dropDownDefaultValue = val;
		},
		_isInvalid:function(val){
			
		},
		openDropDown: function(/*Function*/ callback){
			// rebuild drop down every time, so that constraints get copied (#6002)
			if(this.dropDown){
				this.dropDown.destroy();
			}
			var PopupProto = lang.isString(this.popupClass) ? lang.getObject(this.popupClass, false) : this.popupClass,
				textBox = this,
				value = this.get("value");
			var props = lang.mixin(this.popupProps,{
				onChange: function(value){
					// this will cause InlineEditBox and other handlers to do stuff so make sure it's last
					textBox.set('value', value, true);
				},
				id: this.id + "_popup",
				dir: textBox.dir,
				lang: textBox.lang,
				value: value,
				textDir: textBox.textDir,
				currentFocus: !this._isInvalid(value) ? value : this.dropDownDefaultValue,
				constraints: textBox.constraints,
				filterString: textBox.filterString // for TimeTextBox, to filter times shown
			});
			this.dropDown = new PopupProto(props);
			this.inherited(arguments);
		},
		
		_getDisplayedValueAttr: function(){
			return this.textbox.value;
		},

		_setDisplayedValueAttr: function(/*String*/ value, /*Boolean?*/ priorityChange){
			this._setValueAttr(this.parse(value, this.constraints), priorityChange, value);
		}
	}
);


return _DropDownBox;
});
