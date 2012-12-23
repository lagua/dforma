define("dforma/_DropDownBox", ["dojo", "dijit", "text!dijit/form/templates/DropDownBox.html", "dijit/form/RangeBoundTextBox", "dijit/_HasDropDown"], function(dojo, dijit) {

dojo.declare(
	"dforma._DropDownBox",
	[ dijit.form.RangeBoundTextBox, dijit._HasDropDown ],
	{
		// summary:
		//		Base class for validating, serializable, range-bound date or time text box.

		templateString: dojo.cache("dijit.form", "templates/DropDownBox.html"),

		// hasDownArrow: [const] Boolean
		//		Set this textbox to display a down arrow button, to open the drop down list.
		hasDownArrow: true,

		// openOnClick: [const] Boolean
		//		Set to true to open drop down upon clicking anywhere on the textbox.
		openOnClick: true,

		// flag to _HasDropDown to make drop down Calendar width == <input> width
		forceWidth: true,

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

			// If openOnClick is true, we basically just want to treat the whole widget as the
			// button.  We need to do that also if the actual drop down button will be hidden,
			// so that there's a mouse method for opening the drop down.
			if(this.openOnClick || !this.hasDownArrow){
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
			var PopupProto = dojo.getObject(this.popupClass, false),
				textBox = this,
				value = this.get("value");
			var props = dojo.mixin(this.popupProps,{
				onChange: function(value){
					// this will cause InlineEditBox and other handlers to do stuff so make sure it's last
					dforma._DropDownBox.superclass._setValueAttr.call(textBox, value, true);
				},
				id: this.id + "_popup",
				dir: textBox.dir,
				lang: textBox.lang,
				value: value,
				currentFocus: !this._isInvalid(value) ? value : this.dropDownDefaultValue,
				constraints: textBox.constraints,
				filterString: textBox.filterString, // for TimeTextBox, to filter times shown
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


return dforma._DropDownBox;
});
