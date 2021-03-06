Lagua Form Builder (dforma/Builder)
===================================

Draft for complex form builder. Please note that this specification is still very much subject to change.

Basic setup:
------------
This package requires Dojo Toolkit 1.10. To download and setup Dojo, follow the instructions on http://dojotoolkit.org/download/.

Require dforma/Builder and attach the CSS file (dforma/resources/Builder.css).
To create a form builder, declare a new instance of the widget:
```javascript
	require(["dforma/Builder"], function(Builder){
		var builder = new Builder(parameters);
	});
```
The parameters typically consist of a submit method, that is called when the submit button is pushed, and the initialization data. Optionally there is a cancel method. The first property of the `data` object is an array of controls.

NOTE: if the form builder is placed in the DOM, it's startup method should be called.

## API

### Properties:

Property | Description
-------- | -----------
`baseClass` | Default = dformaBuilder
`data` | Initializing object (see below)
`cancellable` | Boolean indicating a cancel button should be displayed under the form (default = false)
`submittable` | Boolean indicating a submit button should be displayed under the form (default = true)
`hideOptional` | Don't display optional controls, but present an add button that will allow optional controls to be added from a dropdown list (default = false)
`allowOptionalDeletion` |  Allows for optional controls to be removed from the form. They will be added to the dropdown list containing optional controls (default = false)
`allowFreeKey` | For the dropdown list containing optional controls, a combobox is presented that allows for new properties (optional, type = text) to be added to the form (default = false)
`store` | Option required to turn a form into a schema editor (see below)
`editControls` | Option required to turn a form into a schema editor (see below)

The `data` object is used to convey the following:

Property | Description
-------- | -----------
`controls` | An array of control configuration objects (see below)
`submit` | An object containing properties of the submit button
`cancel` | An object containing properties of the cancel button

### Public methods:

Method | Description
------ | -----------
`startup` | Start the builder and render the form if controls are provided
`submit` | Called when the submit button is clicked
`cancel`  | Called when the cancel button is clicked
`rebuild` | Rebuild the form with the current initialization data, or provide a new instance as the first argument


## Controls

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
`options` | Array with options used for select type controls and some subform controls.
`controller` | Boolean indicating this control is a controller (see below).
`dialog` | Boolean. Presents a button. When the button is clicked, the control is displayed in a dialog.
`edit` | Boolean indicating the schema for this control may be edited (requires specific form builder configuration, see below).
`delete` | Boolean indicating this control may be removed from the form (requires specific form builder configuration, see below).
`store` | Some control types make use of a store (typically dojo/store/Memory).

All data in the configuration object will be passed down to the control, so any properties or methods specific to each widget can be overridden via this object (e.g. "checked" for a checkbox).

Dijit Form controls are used for most common types. The default control is a dijit/form/TextBox. Currently the following mapping exists between types and widgets:

Type | Widget | Description
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
grid | dforma/Grid | An (editable) grid (requires dgrid and dstore, needs a store)
multiselect | dforma/MultiSelect
multiselect_freekey | dforma/MultiSelect | A multiselect that allows new (text) values to be added
colorpicker | dforma/ColorPickerBox
color | dforma/ColorPaletteBox
colorpalette | dlagua/w/ColorPalette
group | dforma/Group | A subform, has an object as its value
group (hidden) | dforma/HiddenGroup | This widget has a specific function (see below)
unhidebutton | dijit/form/ToggleButton | This widget has a specific function (see below)


## Controller control

A control may have a `controller` property set to `true`, indicating that it will be used to update the form controls. The controller must have type `select` and a list of options. Each option should in turn have the set of `controls` to create.

Whenever the value of the controller changes, it will rebuild the form with the controls in the selection. Note that a controller does not create a subform, it merely presents a subselection of controls on the same level! 

TODO: Currently a form builder instance can only have a single controller. A new controller is in the making that allows for a more fine-grained subform structure, where any control in the controller's options can be another controller. On top of that, more controller types will be added (e.g. a tab container).

## Control onChange override

Note that when the onChange method of a control is overridden, the function must at least update the value property of the configuration object that was responsible for creating the widget. This is because that value will be used when the form is rebuilt. The configuration object is referenced by the `_config` property.

Also, if the control is the controller itself, the onChange function also needs to rebuild the current form:

```javascript
var control = {
	onChange: function(newValue){
		// if this is a checkbox, override default dijit behavior:
		if(this.type=="checkbox") newValue = this.value = (this.checked === true);
		// update the value of the configuration object:
		this._config.value = newValue;
		// if this is a controller, make sure the form it controls is rebuilt
		if(this.controller) this.form.rebuild();
	}
};
```


## Hidden subforms

Hidden groups can be revealed with an `unhidebutton` type. When the button is clicked, the subform is displayed. This can be used for example to present an alternative address when the user requests it.

## Hiding optional controls

When the `hideOptional` property is `true`, the form builder will present optional properties in a dropdown. An add button is displayed at the bottom of the form. When clicked, the dropdown list is shown and the user may select an optional control.

## Creating a JSON Schema editor

A form builder may be turned into a JSON Schema editor. This feature is mostly left to the implementation, and requires setting `hideOptional`, `allowOptionalDeletion` and `allowFreeKey` correctly. The following properties are also used:

Property | Description
-------- | -----------
`store` | Store containing the schemata to edit
`editControls` | Array of ontrols that will be used to edit the schema properties


## JSON Schema Utility

With the dforma/jsonschema utilitiy control configurations can be generated from JSON Schema. At the moment only [draft version 03](https://tools.ietf.org/html/draft-zyp-json-schema-03) can be used. The `format` property of a schema entry can be used to generate a number of controls. A distinction is made between simple values (string, number, boolean) and complex values (array, object). Currently the set is limited to:

Type | Format | Description
---- | ------ | -------
`string` | | Text input.
`boolean` | | Checkbox.
`boolean` | `unhidebutton` | Show hidden control. See below for additional properties.
`integer` | | Integer validating input.
`number` | | Number validating input.
`number` | `currency` | Enforces currency formatting using the currently selected locale.
`string` | `email` | Email validating input.
`string` | `phone` | Phone number validating input.
`string` | `text` | Textarea.
`string` | `radiogroup` | Group of radio buttons to select a value from a number of choices. The `enum` property will be used for the options.
`string` | `select` | Select. The `enum` property will be used for the options.
`array` | `grid` | Grid (dgrid). Each entry can be edited, either directly in the grid itself (for simple values), or by opening a separate form (for complex values). See below for additional properties.
`object` | |  Group (i.e. subform). Values in this subform will be stored as an object.
any* | `hidden` | A readonly value, hidden from the user. In case the type is `object`, the hidden group may be revealed using an `unhidebutton`.

There are two methods to transform schemas to controls:

Method | Description
------ | -------
schemasToController(schemaList,data,options) | Returns a controller control and adds an option with controls for each schema in the list. When `data` is provided, it will be used to initialize the controls with a value. When `data` holds a value for the controller, that option in the controller will be selected. If not, no option will be selected, unless `selectFirst` is `true` in the `options`. For more `options`, see below.
schemaToControls(schema,data,options) | Returns an array of controls from `schema`. If `data` is provided, it will be used to initialize the controls with a value. The `descriptionProperty` in the `options` determines which property in the schema to use for the controls' description property.

Both functions in dforma/jsonschema can expect to take the same `options` argument, because they pass their `options` back and forth until all schemata are traversed and transformed to controls.

### dforma/jsonschema `options`:
Property | Description
-------- | -----------
`selectFirst` | When no data is provided, or the controller has no value, select the first option in the controller.
`idProperty` | Determines which property in the schema to use for the controller options' id.
`titleProperty` | Determines which property in the schema to use for the controller options' title property.
`descriptionProperty` | Determines which property in the schema to use for the controller options' title property.
`controller` | Object that overrides the generated controller control configuration. Primarily used to set the `name` of the controller. Can also be used to set `title` and `searchAttr`.
`editControls` | Array of controls that will be used to edit the schema properties.

## JSON Schema extension

All schema properties are taken into account when generating controls. However, to generate the full stack of the form components above, JSON Schema has to be extended with the following:

Property | Description
-------- | -------
`columns` | Array of column names for format `grid`.
`currency` | The currency to use for format `currency`.
`controller` | Object providing the current form with a controller (typically in type `array`).
`target` | The object to unhide for format `unhidebutton`. The default is the parent object.
`invalidMessage` | Tooltip text that appears when the value of the control is invalid.
`dialog` | Boolean. Presents a button. When the button is clicked, the control is displayed in a dialog.

### Condition

Whenever an implementation of a form builder requires it, JSON Schema may be extended with a `condition` property. This object may be provided to make decisions about how to process or render the form based on the data that was harvested. This property is purely formal and is not implemented in the form builder itself. A `condition` object has the following properties:

Property | Description
-------- | -------
`query` | An rql query.
`links` | An array containing references to (local) store(s) that contain the harvested data to query. When this is not available, the standard JSON Schema `links` property may be used instead. 
`message` | A message to show when the query returns a result.

## BIG TODO

* Testing
* Adding more control /schema types
* Creating mixins for too specific parts