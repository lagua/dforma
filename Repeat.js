/*
simple grouping panel for form elements
*/
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dforma/Group",
	"dojo/i18n!/js_shared/dojo/1.8/dforma/nls/common.js",
	"dijit/form/Button"
],function(declare,lang,array,domConstruct,Group,common,Button){
return declare("dforma.Repeat",[Group],{
	templateString: "<div class=\"dijit dijitReset dformaRepeat\" data-dojo-attach-point=\"focusNode\" aria-labelledby=\"${id}_label\"><div class=\"dijitReset dijitHidden dformaRepeatLabel\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></div><div class=\"dijitReset dijitHidden dformaRepeatHint\" data-dojo-attach-point=\"hintNode\"></div><table data-dojo-attach-point=\"repeatNode\"></table><div id=\"${id}_buttonNode\" class=\"dijitReset dformaRepeatButton\" data-dojo-attach-point=\"buttonNode\"></div><div class=\"dijitReset dformaRepeatMessage\" data-dojo-attach-point=\"messageNode\"></div></div>",
	label: "",
	cols:1,
	_col:0,
	_headerNode:null,
	_rows:null,
	_controls:null,
	_addButton:null,
	value:null,
	message:"",
	startup:function(){
		this.inherited(arguments);
		this._headerNode = domConstruct.create("tr",{},this.repeatNode);
		this._rows = [];
		this._controls = [];
		var self = this;
		this.value = [];
		this._addButton = new Button({
			label:common.buttonAdd,
			onClick:function(){
				self.cloneRow();
			}
		}).placeAt(this.buttonNode);
	},
	_setLabelAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this._set("label", content);
		this["labelNode"].innerHTML = content;
 	},
 	cloneRow:function(){
 		// add new row
 		var row = this._rows.length;
 		var self = this;
		this._rows.push({
			node:domConstruct.create("tr",{},this.repeatNode),
			controls:[]
		});
		this.value.push({});
		array.forEach(this._controls,function(_){
			// TODO add _setValueAttr
			if(_.params.value) this.value[row][_.params.name] = _.params.value;
			_.params.row = row;
			var widget = new _.Widget(_.params);
			this.addChild(widget);
		},this);
		var removeNode = domConstruct.create("td",{
 			"class":"dformaRepeatCol"
 		},this._rows[row].node);
		var removeBtn = new Button({
			row:row,
			label:common.buttonRemove,
			onClick:function(){
				self.removeRow(this.row);
			}
		}).placeAt(removeNode);
		this._rows[row].controls.push(removeBtn);
 	},
 	_getValueAttr: function(){
		// summary:
		//		Returns array of objects representing form values.   See description of `value` for details.
		var arr = [];
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
		return arr;
 	},
 	removeRow:function(row){
 		if(this.schema.minItems && this._rows.length==this.schema.minItems) return;
 		array.forEach(this._rows[row].controls,function(_){
 			_.destroyRecursive();
 		});
 		this.repeatNode.removeChild(this._rows[row].node);
 		this.value.splice(row,1);
 		this._rows.splice(row,1);
 	},
 	addControl:function(Widget,params){
 		domConstruct.create("th",{
			"class":"dformaRepeatHeader"+params.required ? " dformaRequired" : "",
			"innerHTML":params.label
		},this._headerNode);
 		this._controls.push({
 			Widget:Widget,
 			params:params
 		});
 		if(this._controls.length==this.options[0].controls.length) {
 			// add first row
 			this.cloneRow();
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
 	},
 	_setMessageAttr: function(/*String*/ content){
		// summary:
		//		Hook for set('label', ...) to work.
		// description:
		//		Set the label (text) of the button; takes an HTML string.
		this._set("message", content);
		this["messageNode"].innerHTML = content;
 	}
});
});