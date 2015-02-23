/*
simple grouping panel for form elements
*/
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-class",
	"./Group",
	"dforma/util/i18n",
	"dijit/form/Button"
],function(declare,lang,array,domConstruct,domClass,Group,i18n,Button){
return declare("dforma.Repeat",[Group],{
	baseClass:"dformaRepeat",
	cols:1,
	_col:0,
	_headerNode:null,
	_rows:null,
	_controls:null,
	_addButton:null,
	label:"",
	value:null,
	multiple:true,
	startup:function(){
		this.inherited(arguments);
		domClass.remove(this.buttonNode,"dijitHidden");
		this.repeatNode = this.containerNode;
		this._headerNode = domConstruct.create("tr",{},this.repeatNode);
		this._rows = [];
		this._controls = [];
		var self = this;
		if(!this.value) this.value = [];
		var common = i18n.load("dforma","common");
		if(!this.schema.hasOwnProperty("add") || this.schema.add) {
			this._addButton = new Button({
				label:common.buttonAdd+(this.label ? " "+this.label : ""),
				onClick:function(){
					self.cloneRow();
				}
			}).placeAt(this.buttonNode);
		}
	},
 	cloneRow:function(){
 		// add new row
 		var common = i18n.load("dforma","common");
 		var row = this._rows.length;
 		var self = this;
		this._rows.push({
			node:domConstruct.create("tr",{},this.repeatNode),
			controls:[]
		});
		array.forEach(this._controls,function(_){
			// TODO add _setValueAttr
			_.params.row = row;
			var widget = new _.Widget(_.params);
			this.addChild(widget);
		},this);
		var removeNode = domConstruct.create("td",{
 			"class":"dformaRepeatCol"
 		},this._rows[row].node);
		if(!this.schema.hasOwnProperty("delete") || this.schema["delete"]) {
			var removeBtn = new Button({
				row:row,
				label:common.buttonRemove,
				onClick:function(){
					self.removeRow(this.row);
				}
			}).placeAt(removeNode);
			this._rows[row].controls.push(removeBtn);
		}
 	},
 	_getValueAttr: function(){
		// summary:
		//		Returns array of objects representing form values.   See description of `value` for details.
		var arr = this.value;
		array.forEach(this._getDescendantFormWidgets(), function(widget){
			var name = widget.name;
			var row = widget.row;
			if(!arr[row]) arr[row] = {};
			var obj = arr[row];
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
					// checkbox/toggle button
					lang.setObject(name, value==="on", obj);
				}
			}else{
				var prev=lang.getObject(name, false, obj);
				//if(typeof prev != "undefined"){
					if(lang.isArray(prev)){
						prev.push(value);
					//}else{
					//	lang.setObject(name, [prev, value], obj);
					//}
				}else{
					// unique name
					lang.setObject(name, value, obj);
				}
			}
		});
		return arr;
 	},
 	_setValueAttr: function(/*Object*/ arr){
 		if(!this._started) return;
		// summary:
		//		Fill in form values from according to an Object (in the format returned by get('value'))
 		array.forEach(arr,function(obj,i){
 			if(i>0 || !this._rows.length) this.cloneRow();
 			// generate map from name --> [list of widgets with that name]
 			var map = { };
 			array.forEach(this._getDescendantFormWidgets(), function(widget){
 				if(!widget.name){ return; }
 				var entry = map[widget.name] || (map[widget.name] = [] );
 				if(widget.row==i) entry.push(widget);
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
 		},this);
 	},
 	removeRow:function(row){
 		if(this.schema.minItems && this._rows.length==this.schema.minItems) return;
 		array.forEach(this._rows[row].controls,function(_){
 			_.destroyRecursive();
 		});
 		this.repeatNode.removeChild(this._rows[row].node);
 		this._rows.splice(row,1);
 	},
 	addControl:function(Widget,params){
 		domConstruct.create("th",{
			"class":"dformaRepeatHeader"+(params.required ? " dformaRequired" : ""),
			"innerHTML":params.label
		},this._headerNode);
 		this._controls.push({
 			Widget:Widget,
 			params:params
 		});
 		if(this._controls.length==this.options[0].controls.length) {
 			// add first row
 			if(!this.schema.hasOwnProperty("minItems") || this.schema.minItems>0) this.cloneRow();
 		}
 	},
 	addChild:function(widget,insertIndex){
 		var row = this._rows.length-1;
 		this._rows[row].controls.push(widget);
 		this.containerNode = domConstruct.create("td",{
 			"class":"dformaRepeatCol"
 		},this._rows[row].node);
 		this.inherited(arguments);
 		// reset containerNode so all children are found
 		this.containerNode = this.repeatNode;
 	}
});
});