/*
simple grouping panel for form elements
*/
define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dijit/_Widget",
	"dijit/_TemplatedMixin",
	"dijit/_Container",
	"dijit/_Contained",
	"dijit/form/_FormValueWidget",
	"dijit/form/_FormMixin",
	"dforma/Label"
],function(declare,array,lang,domClass,_Widget,_TemplatedMixin,_Container,_Contained, _FormWidget, _FormMixin, Label){
return declare("dforma.Group",[_FormWidget,_Container,_Contained, _FormMixin],{
	templateString: "<div class=\"dijit dijitReset\" data-dojo-attach-point=\"focusNode\" aria-labelledby=\"${id}_label\"><div class=\"dijitReset dijitHidden dformaGroupLabel\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></div><div class=\"dijitReset dijitHidden dformaGroupHint\" data-dojo-attach-point=\"hintNode\"></div><div data-dojo-attach-point=\"containerNode\"></div><div class=\"dijitReset dijitHidden dformaGroupMessage\" data-dojo-attach-point=\"messageNode\"></div></div>",
	name:"",
	hint:"",
	label: "",
	message:"",
	baseClass:"dformaGroup",
	value:null, // in case of object
	startup:function(){
		this.inherited(arguments);
		this.value = {};
		domClass.toggle(this.labelNode,"dijitHidden",!this.label);
		domClass.toggle(this.messageNode,"dijitHidden",!this.message);
	},
	_getValueAttr: function(){
		// summary:
		//		Returns Object representing form values.   See description of `value` for details.
		// description:

		// The value is updated into this.value every time a child has an onChange event,
		// so in the common case this function could just return this.value.   However,
		// that wouldn't work when:
		//
		// 1. User presses return key to submit a form.  That doesn't fire an onchange event,
		// and even if it did it would come too late due to the defer(...) in _handleOnChange()
		//
		// 2. app for some reason calls this.get("value") while the user is typing into a
		// form field.   Not sure if that case needs to be supported or not.

		// get widget values
		var obj = { };
		array.forEach(this._getDescendantFormWidgets(), function(widget){
			var name = widget.name;
			if(!name || widget.disabled){ return; }

			// Single value widget (checkbox, radio, or plain <input> type widget)
			var value = widget.get('value');

			// Store widget's value(s) as a scalar, except for checkboxes which are automatically arrays
			if(typeof widget.checked == 'boolean'){
				if(/Radio/.test(widget.declaredClass)){
					// radio button
					if(value !== false){
						lang.setObject(name, value, obj);
					}else{
						// give radio widgets a default of null
						value = lang.getObject(name, false, obj);
						if(value === undefined){
							lang.setObject(name, null, obj);
						}
					}
				}else{
					lang.setObject(name, value==="on", obj);
				}
			}else{
				var prev=lang.getObject(name, false, obj);
				if(typeof prev != "undefined"){
					if(lang.isArray(prev)){
						prev.push(value);
					}else{
						lang.setObject(name, [prev, value], obj);
					}
				}else{
					// unique name
					lang.setObject(name, value, obj);
				}
			}
		});
		return obj;
	},
	_setValueAttr: function(/*Object*/ obj){
		// summary:
		//		Fill in form values from according to an Object (in the format returned by get('value'))

		// generate map from name --> [list of widgets with that name]
		var map = { };
		array.forEach(this._getDescendantFormWidgets(), function(widget){
			if(!widget.name){ return; }
			var entry = map[widget.name] || (map[widget.name] = [] );
			entry.push(widget);
		});

		for(var name in map){
			if(!map.hasOwnProperty(name)){
				continue;
			}
			var widgets = map[name],						// array of widgets w/this name
				values = lang.getObject(name, false, obj);	// list of values for those widgets

			if(values === undefined){
				continue;
			}
			values = [].concat(values);
			if(typeof widgets[0].checked == 'boolean'){
				// for checkbox/radio, values is a list of which widgets should be checked
				array.forEach(widgets, function(w){
					w.set('value', array.indexOf(values, w._get('value')) != -1);
				});
			}else if(widgets[0].multiple){
				// it takes an array (e.g. multi-select)
				widgets[0].set('value', values);
			}else{
				// otherwise, values is a list of values to be assigned sequentially to each widget
				array.forEach(widgets, function(w, i){
					w.set('value', values[i]);
				});
			}
		}
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
 	}
});
});