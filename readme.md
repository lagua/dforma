Lagua Form Builder (dforma/Builder)
===================================

Preliminary draft for lagua complex form builder widget documentation

Basic setup:
------------
Require in lagua.form.Builder and the CSS.
To create a form builder, declare a new instance of the widget:

	var fb = new dforma.Builder(properties);

The properties typically consist of submit method, that is called when the submit button is pushed, and the data. Optionally there is a cancel method. The first property of data is an array of controls.

NOTE: if the form builder is placed in the DOM, it’s startup method should be called.

## Controller element:

## Controller element mixin:
Properties on elements can be overridden with the usual dijit properties. Note however that the onChange function must at least set the controller object that was responsible for creating the widget. Also, if the object is the form controller, the onChange function needs to set the form:

	control.onChange = function(){
		// set the value of the controller build object
		control.value = this.value;
		// make sure the formbuilder is rebuilt
		formbuilder.rebuild();
	}


## Creating control from schema:
Preset values in data object are used!
The schema format.

## Hidden elements / optionals:

## Control object format should be:

* name (string, required)
* type (string, optional, defaults to string)
* required (boolean, optional, defaults to false)
* value (optional, element becomes optional if not declared)
* edit (boolean, optional, defaults to false)
* add (boolean, optional, defaults to false)
* description (string, optional, is used in optional element selection)