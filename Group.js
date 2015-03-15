/*
simple grouping panel for form elements
*/
define([
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"./_FormValueWidget",
	"./_FormMixin",
	"dijit/_Container",
	"./_GroupMixin"
],function(declare,array,lang,_FormValueWidget,_FormMixin,_GroupMixin){
return declare("dforma.Group",[_GroupMixin],{
	name:"",
	templateString: "<div class=\"dijit dijitReset\" data-dojo-attach-point=\"focusNode\" aria-labelledby=\"${id}_label\"><div class=\"dijitReset dijitHidden ${baseClass}Label\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></div><div class=\"dijitReset dijitHidden ${baseClass}Hint\" data-dojo-attach-point=\"hintNode\"></div><div data-dojo-attach-point=\"containerNode\"></div><div class=\"dijitReset dijitHidden ${baseClass}Message\" data-dojo-attach-point=\"messageNode\"></div><div class=\"dijitReset dijitHidden ${baseClass}ButtonNode\" data-dojo-attach-point=\"buttonNode\"></div></div>",
	baseClass:"dformaGroup",
	value:null, // in case of object
	_getValueAttr: function(){
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
					w.set('value', array.indexOf(values, w._get('value')==="on") != -1);
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
 	}
});
});