Lagua Form Builder (dforma/Builder)
===================================

Draft for complex form builder

Basic setup:
------------
This package requires Dojo Toolkit 1.10. To download and setup Dojo, follow the instructions on http://dojotoolkit.org/download/.

Require dforma/Builder and attach the CSS file (dforma/resources/Builder.css).
To create a form builder, declare a new instance of the widget:
```javascript
	require(["dforma/Builder"], function(Builder){
		var builder = new Builder(properties);
	});
```
The properties typically consist of submit method, that is called when the submit button is pushed, and the data. Optionally there is a cancel method. The first property of data is an array of controls.

NOTE: if the form builder is placed in the DOM, it’s startup method should be called.

## API:

fb properties/methods

## Controls:

A control is expressed using a simple configuration object that describes how it will be rendered once the form builder is started.

Property | Description
-------- | -----------
`name` | Name of the control. Required.
`type` | Type of control, loosely based on HTML5 form controls. Defaults to `text`.
`required` | Boolean indicating that this control must have a value upon submission.
`readonly` | Boolean indicating that the control is read-only.
`value` | Starting value of the control.
`title` | Used for the label or placeholder of the control. If not present, name is used.
`description` | Used for additional information about the control, or a hint.
`hidden` | Boolean indicating that the control must be hidden
`options` | Array with options used for select type controls and some sub-form controls.
`controller` | Boolean indicating this control is a sub-form controller (see below).
`dialog` | Presents a button. When the button is clicked, the control is displayed in a dialog.
`edit` | Boolean indicating the schema for this control may be edited (requires specific form builder configuration, see below).
`delete` | Boolean indicating this control may be removed from the form (requires specific form builder configuration, see below).

All data in the configuration object will be passed down to the control, so any properties or methods specific to each widget can be overridden via this object (e.g. "checked" for a checkbox).

Dijit Form controls are used for most common types. The default control is a dijit/form/TextBox. Currently this mapping exists between types and widgets:

Type | Widget | Details
---- | ------ | -------
text | dijit/form/TextBox
text (required / read-only) | dijit/form/ValidationTextBox
email | dijit/form/ValidationTextBox
phone | dijit/form/ValidationTextBox
date | dijit/form/DateTextBox
checkbox | dijit/form/CheckBox
combo | dijit/form/ComboBox
select | dijit/form/FilteringSelect
textarea | dijit/form/Textarea
spinner | dijit/form/NumberSpinner
number | dijit/form/NumberTextBox
currency | dijit/form/CurrencyTextBox
hslider | dijit/form/HorizontalSlider
vslider | dijit/form/VerticalSlider
repeat | dforma/Repeat
lookuplist | dforma/LookupList | An array of values, chosen from a `select` 
radiogroup | dforma/RadioGroup
list | dforma/List | An (editable) grid (requires dgrid)
multiselect | dforma/MultiSelect
multiselect_freekey | dforma/MultiSelect | A multiselect that allows new (text) values to be added
colorpicker | dforma/ColorPickerBox
color | dforma/ColorPaletteBox
colorpalette | dlagua/w/ColorPalette
group | dforma/Group | A subform, has an object as its value
group (hidden) | dforma/HiddenGroup | This widget has a specific function (see below)
unhidebutton | dijit/form/ToggleButton | This widget has a specific function (see below)


## Controller control:

A control may have a `controller` property set to `true`, indicating that it will be used to update the form controls. The controller must have type `select` and a list of options. Each option should in turn have the set of `controls` to create.

Whenever the value of the controller changes, it will rebuild the form with the controls in the selection.

TODO: Currently a form builder instance can only have a single controller. A new controller is in the making that allows for a more fine-grained sub-form structure, where any control in the controller's options can be another controller. On top of that, more controller types will be added (e.g. a tab container).

## Control onChange override:

Note that when the onChange method of a control is overridden, the function must at least update the value property of the configuration object that was responsible for creating the widget. The object is referenced by the `_config` property. This is because that value will be used when the form is rebuilt.

Also, if the control is the controller itself, the onChange function also needs to rebuild the sub-form:

```javascript
var control = {
	onChange: function(newValue){
		// if this is a checkbox, override default dijit behavior:
		if(this.type=="checkbox") newValue = this.value = (this.checked === true);
		// update the value of the configuration object:
		this._config.value = newValue;
		// if this is a controller, make sure the subform is rebuilt
		if(this.controller) this.form.rebuild();
	}
};
```


## Hiddensubformss:
Hidden groups can be revealed with an `unhidebutton` type. When the button is clicked, the subform is displayed. This can be used for example to present an alternative address when the user requests it.

## Hiding optional controls:

When the `hideOptional` property is `true`, the form builder will present optional properties in a select... (add button)

## JSON Schema Utility:

With this utilitiy control configurations can be generated from JSON Schema. Currently only draft version 03 can be used. To generate the full stack of form components, JSON Schema has been extended with the following:

