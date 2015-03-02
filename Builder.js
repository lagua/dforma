define([
	"require",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/aspect",
	"dojo/Deferred",
	"dojo/when",
	"dojo/promise/all",
	"dojo/keys",
	"dojo/number",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/on",
	"dojo/request",
	"./store/FormData",
	"./_GroupMixin",
	"./Group",
	"./Label",
	"./jsonschema",
	"dforma/util/i18n",
	"dijit/Dialog",
	"dijit/form/Form",
	"dijit/form/_FormValueWidget",
	"dijit/form/Button",
	"dijit/form/FilteringSelect",
	"dijit/form/ComboBox",
	"dijit/form/TextBox",
	"dijit/registry",
	"./Input",
	"dforma/util/string/toProperCase",
	"dforma/validate/web",
	"dforma/validate/us",
	"dojo/i18n!./nls/common"
],function(require,declare,lang,array,aspect,Deferred,when,all,
		keys,number,domConstruct,domClass,on,request,
		FormData,_GroupMixin,Group,Label,jsonschema,i18n,Dialog,Form,
		_FormValueWidget,Button,FilteringSelect,ComboBox,TextBox,registry,
		Input){

var common = i18n.load("dforma","common");

// from https://github.com/kriszyp/json-schema/blob/master/lib/links.js#L41
function substitute(linkTemplate, instance, exclude){
	exclude = exclude || [];
	return linkTemplate.replace(/\{([^\}]*)\}/g, function(t, property){
		var value = exclude.indexOf(property)>-1 ? "*" : instance[decodeURIComponent(property)];
		if(value instanceof Array){
			// the value is an array, it should produce a URI like /Table/(4,5,8) and store.get() should handle that as an array of values
			return '(' + value.join(',') + ')';
		}
		return value;
	});
};

var resolveCache = {};

var Builder = declare("dforma.Builder",[_GroupMixin,Form],{
	baseClass:"dformaBuilder",
	templateString: "<div aria-labelledby=\"${id}_label\"><div class=\"dijitReset dijitHidden ${baseClass}Label\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></div><form class=\"dformaBuilderForm\" data-dojo-attach-point='containerNode' data-dojo-attach-event='onreset:_onReset,onsubmit:_onSubmit' ${!nameAttrSetting}></form><div class=\"dijitReset dijitHidden ${baseClass}Hint\" data-dojo-attach-point=\"hintNode\"></div><div class=\"dijitReset dijitHidden ${baseClass}Message\" data-dojo-attach-point=\"messageNode\"></div><div class=\"dijitReset ${baseClass}ButtonNode\" data-dojo-attach-point=\"buttonNode\"></div></div>",
	controller:null,
	controllerWidget:null,
	data:null,
	store:null,
	configProperty:"data",
	refProperty:"$ref",
	cancellable:false,
	submittable:true,
	templatePath:"",
	templateExtension:".html",
	hideOptional:false,
	allowFreeKey:false, // schema editor: set true for add
	allowOptionalDeletion:false, // schema editor: set false for edit/delete
	editControls:null, // schema editor: set as controls for the editor
	controlmap:null, // controlmap for internal jsonschema
	BuilderClass:Builder,
	submit:function(){},
	cancel:function(){},
	onSubmit:function(e) {
		this.submit();
		return false;
	},
	focus: function(){
		// no matter
	},
	_removeProperty:function(c,controller){
		var item = controller.item;
		var props = item.properties;
		delete props[c.name];
		if(this.store) {
			return this.store.put({id:item.id,properties:props},{incremental:true});
		} else {
			return new Deferred().resolve();
		}
	},
	_addEditForm:function(c,controller){
		var self = this;
		var item = controller.item;
		var props = item.properties;
		var id = item.id;
		var bools = [];
		for(var k in props) {
			if(c.name==k) {
				array.forEach(c.editControls,function(ctrl,i){
					if(ctrl.type=="checkbox") {
						bools.push(ctrl.name);
						c.editControls[i].checked = props[k][ctrl.name];
					} else if(ctrl.type=="multiselect_freekey") {
						var ops = [];
						array.forEach(props[k][ctrl.name],function(op){
							ops.push({value:op,label:op,selected:true});
						});
						c.editControls[i].options = ops;
					} else {
						c.editControls[i].value = props[k][ctrl.name];
					}
				});
				// TODO: insert a subform
				var fb = new parent.BuilderClass({
					style:"height:100%;border:1px solid gray",
					cancel:function(){
						self.rebuild();
					},
					cancellable:true,
					submit:function(){
						if(!this.validate()) return;
						var data = this.get("value");
						for(var k in data) {
							// it may be a group
							// make all booleans explicit
							if(lang.isArray(data[k])) {
								if(array.indexOf(bools,k)>-1) {
									array.forEach(data[k],function(v,i){
										data[k][i] = (v=="on");
									});
									if(data[k].length===0) {
										data[k] = false;
									} else if(data[k].length<2) {
										data[k] = data[k][0];
									}
								}
							} else {
								if(!data[k]) delete data[k];
							}
						}
						props[c.name] = data;
						if(c.add) {
							delete c["add"];
							controller.item.controls.push(lang.mixin(c,data));
						}
						if(self.store) when(self.store.put({id:id,properties:props},{incremental:true}),function(res){
						},function(err){
							if(self.store.onError) self.store.onError(err,"put",{id:id,properties:props},{incremental:true});
						});
						self.rebuild();
					},
					data:{
						controls:c.editControls,
						cancel: {
							label:common.buttonCancel
						},
						submit:{
							label:common.buttonSave
						}
					}
				});
				return fb;
			}
		}
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
			case "list":
				req = "dforma/Grid";
			break;
			case "multiselect":
			case "multiselect_freekey":
				req = "dforma/MultiSelect";
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
			case "repeat":
				cc.cols = c.options[0].controls.length;
				cc.item = c.options[0];
				cc.hint = c.description || "";
			break;
			case "textarea":
				cc.block = true;
			break;
			case "list":
			case "grid":
				cc.hint = c.description || "";
				if(c.columns) {
					for(var k in c.columns) {
						if(c.columns[k].format=="currency") {
							cc.columns[k].get = function(object){
				                return number.format(object[k], {
				                	places: 2
				                });
				            }
						}
					}
				}
				// create bound subform
				if(!cc.store) cc.store = parent.store;
				cc.subform = new parent.BuilderClass({
					//label:cc.label,
					cancellable:true,
					cancel: function(){
						try {
							domClass.toggle(this.parentform.domNode,"dformaSubformActive",false);
							domClass.toggle(parent.buttonNode,"dformaSubformActive",false);
							domClass.toggle(parent.hintNode,"dformaSubformActive",false);
							domClass.toggle(this.domNode,"dijitHidden",true);
							parent.layout();
						} catch(err) {
							console.error("Subform domClass Error: "+err.description);
						}
						if(!this.data) return;
						// cancelled new?
						if(this.data && this.data.id && this.parentform.newdata) this.parentform.store.remove(this.data.id);
						this.data.id = null;
						this.parentform.newdata = false;
					},
					submit: function(){
						if(!this.validate()) return;
						domClass.toggle(this.parentform.domNode,"dformaSubformActive",false);
						domClass.toggle(parent.buttonNode,"dformaSubformActive",false);
						domClass.toggle(parent.hintNode,"dformaSubformActive",false);
						domClass.toggle(this.domNode,"dijitHidden",true);
						parent.layout();
						var data = this.get("value");
						// checkboxes
						var columns=c.columns ? c.columns : [];
						array.forEach(columns,function(c){
							var k = c.field;
							if(c.editor=="checkbox" && data[k] instanceof Array) {
								data[k] = data[k][0];
							}
						});
						this.parentform.save(data,{
							overwrite:true
						});
						return true;
					}
				});
				domClass.toggle(cc.subform.domNode,"dijitHidden",true);
				/*var validate = lang.hitch(cc.subform,cc.subform.validate);
				cc.subform.validate = function(){
					if(!this[config]) return true;
					return validate();
				};*/
				cc.subform.own(
					aspect.after(cc.subform,"layout",lang.hitch(parent,function(){
						this.layout();
					})),
					aspect.after(parent,"cancel",lang.hitch(cc.subform,function(){
						this.cancel();
					}))
				);
				cc.onEdit = function(id,options){
					options = options || {};
					this.store.get(id).then(lang.hitch(this,function(data){
						domClass.toggle(this.domNode,"dformaSubformActive",true);
						domClass.toggle(parent.buttonNode,"dformaSubformActive",true);
						domClass.toggle(parent.hintNode,"dformaSubformActive",true);
						domClass.toggle(this.subform.domNode,"dijitHidden",false);
						var items = c.schema.items;
						if(!items || !(items instanceof Array) || !items.length) {
							throw new Error("Items where not found on the schema for "+c.name);
						}
						var controls = c.controller ? [jsonschema.schemasToController(items,data,{
							selectFirst:true,
							controller:c.controller,
							controlmap:parent.controlmap
						})] : jsonschema.schemaToControls(items[0],data,{
							controlmap:parent.controlmap,
							uri:this.store.target
						});
						this.subform.rebuild({
							id:id,
							options:options,
							// TODO: create type for items instanceof array
							controls:controls,
							submit:{
								label:common.buttonSave
							}
						});
					}));
				};
			break;
			case "group":
				cc.item = c.options[0];
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
					domClass.toggle(this.getParent().containerNode,"dijitHidden",!this.checked);
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
		co = new Widget(cc,cc.refNode);
		if(cc.type=="list" || cc.type=="grid"){
			var _lh = aspect.after(parent,"layout",lang.hitch(co,function(){
				_lh.remove();
				if(this.store && this.store.selectedId) {
					var id = this.store.selectedId;
					this.newdata = this.store.newdata;
					delete this.store.newdata;
					this.store.selectedId = null;
					this.onEdit && this.onEdit(id);
				}
			}));
		} else if(cc.type=="select") {
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
	},
	rebuild:function(config){
		var dd = new Deferred();
		config = config || this[this.configProperty];
		this[this.configProperty] = config;
		var dj = dojo;
		this.destroyDescendants();
		var controls = config.controls;
		var controller;
		var self = this;
		// get the controls of the current controller selection
		array.forEach(controls,function(c){
			if(c.controller && c.type!="repeat" && c.type!="group") {
				self.controller = c;
				array.forEach(c.options,function(o){
					if(o.id==c.value && o.controls) controls = controls.concat(o.controls);
				});
			}
		});
		var optional = [];
		var hideOptional = this.hideOptional;
		var add;
		function optionalSort(){
			optional.sort(function(a,b){
			    return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
			});
		}
		function preload(controls) {
			var reqs = controls.map(lang.hitch(self,"controlModuleMapper"));
			var d = new Deferred();
			require(reqs,function(){
				var args = arguments;
				controls.forEach(function(c,i){
					c.Widget = args[i];
				});
				d.resolve();
			});
			return d;
		}
		function render(c,parent) {
			if(!parent) parent = self;
			var co,l;
			var Widget = c.Widget;
			delete c.Widget;
			var lbl = c.title ? c.title : c.name.toProperCase();
			var cc = lang.mixin({
				placeHolder:lbl,
				label:lbl,
				"class": "dforma"+c.type.toProperCase()+" dforma"+c.type.toProperCase()+"-"+c.name,
				onChange:function(val){
					if(this.type=="checkbox") val = this.value = (this.checked === true);
					this._config.value = val;
					if(this.controller) {
						var parent = this.getParent();
						if(parent && typeof parent.rebuild=="function") parent.rebuild();
					}
				},
				getParent:function(){
					var parent = registry.getEnclosingWidget(this.domNode.parentNode);
					if(parent instanceof Label){
						parent = parent.getParent();
					}
					return parent;
				},
				templatePath:parent.templatePath ? parent.templatePath+"/"+c.name : "",
				templateExtension:parent.templateExtension,
				_config:c
			},c);
			// default param mapping
			if(c.hasOwnProperty("readonly")) cc.readOnly = c.readonly;
			if(c.hasOwnProperty("storeParams")) {
				if(!c.storeParams.target) {
					cc.storeParams.local = true;
				}
				cc.store = new FormData(cc.storeParams);
			}
			// widget param mapping
			co = self.controlWidgetMapper(cc,Widget,parent);
			// widget placement
			if(c.controller) {
				controller = parent.controllerWidget = co;
			}
			if(c.type=="grid" || c.type=="list") {
				parent.addChild(co);
				cc.subform.parentform = co;
				parent.addChild(cc.subform);
			} else if(c.type=="repeat" || c.type=="group"){
				parent.addChild(co);
				array.forEach(c.options,function(o){
					if(o.controls) {
						preload(o.controls).then(function(){
							array.forEach(o.controls,function(c){
								render(c,co);
							});
						});
					}
				});
				co.set("value",c.value);
			} else if(parent.type=="repeat"){
				parent.addControl(Widget,cc);
			} else if(c.type=="hidden" || c.hidden) {
				parent.addChild(co);
				domClass.toggle(co.domNode,"dijitHidden",true);
			} else if(c.type=="unhidebutton") {
				var target;
				if(c.target) {
					for(var i=0;i<controls.length;i++) {
						if(controls[i].name==c.target) {
							target = controls[i].widget;
							break;
						}
					}
					if(target) {
						co.addChild(target);
						parent.addChild(co);
					}
				} else {
					co.placeAt(parent.buttonNode);
				}
			} else {
		 		l = new Label({
					label:cc.label,
					"class":"dformaLabelFor"+c.type.toProperCase(),
					child:co,
					title:c.description /*&& !c.schema.dialog*/ ? c.description : cc.label
				});
		 		if(c.type=="checkbox") {
		 			l.on("click", function(evt){
		 				if(evt.target.nodeName=="INPUT") return;
		 				co.set("checked",!co.checked);
		 			});
		 		}
		 		if(c.dialog) {
		 			var bt = new Button({
		 				label:c.dialog,
		 				"class":"dformaPopupTrigger",
		 				onClick:function(){
		 					new Dialog({
								content:c.description
							}).show();
		 				}
		 			}).placeAt(l["labelNode_"+l.position],"before")
				}
		 		parent.addChild(l);

				if(c.type=="multiselect_freekey") {
					l.child = null;
					l.addChild(co);
					l.addChild(new TextBox({
						onChange:function(val){
							if(val) co.addOption({value:val,label:val,selected:true});
							this.set("value","");
						},
						onBlur:function(){
							this.onChange(this.value);
						},
						onKeyPress:function(e) {
							if(e.charOrCode==keys.ENTER) {
								this.focusNode.blur();
							}
						}
					}));
				}
			}
			if(c.edit===true || c["delete"]===true) {
				if(!l) {
					l = new Label({
						label: cc.label,
						"class":"dformaLabelFor"+c.type.toProperCase(),
						child:co,
						title:c.description ? c.description : cc.label
					});
					parent.addChild(l);
				}
				/*if(!self.allowOptionalDeletion && c.description) {
					domConstruct.create("span",{
						innerHTML:strings.truncatewords_html(c.description,{
							words:8
						}),
						title:c.description,
						"class":"dijitReset dijitInline"
					},l.domNode);
				}*/
				if(c.edit===true) {
					co.editButton = new Button({
						label:"Edit",
						target:{
							control:c,
							widget:co,
							label:l
						},
						controller:controller,
						showLabel:false,
						iconClass:"dijitEditorIcon dformaEditIcon",
						onClick:function(){
							var fb = self._addEditForm(this.target.control,this.controller);
							this.target.label.addChild(fb);
							var _sh, _ch;
							function end(){
								if(_sh) _sh.remove();
								if(_ch) _ch.remove();
								this.target.widget.editButton.destroyRecursive();
								if(this.target.widget.deleteButton) this.target.widget.deleteButton.destroyRecursive();
								if(this.target.control.add && add) {
									// try destroying add button
									if(optional.length || self.allowFreeKey) {
										add.set("disabled",false);
									} else {
										add.destroyRecursive();
									}
								}
							};
							_sh = aspect.after(fb,"submit",lang.hitch(this,end));
							_ch = aspect.after(fb,"cancel",lang.hitch(this,end));
						}
					});
					l.addChild(co.editButton);
				}
				if(c["delete"]) {
					co.deleteButton = new Button({
						label:"Delete",
						showLabel:false,
						target:{
							control:c,
							widget:co,
							label:l
						},
						iconClass:"dijitEditorIcon dformaDeleteIcon",
						onClick:function(){
							this.target.widget.set("value",null);
							this.target.label.destroyRecursive();
							var control = this.target.control;
							// edit means typeStore must be modified
							if(control.edit || (control["delete"] && !self.allowOptionalDeletion)) {
								self._removeProperty(control, controller);
							} else {
								// if in controls push back up stack
								controls.forEach(function(c,i){
									if(control.name===c.name) {
										optional.push(control);
										optionalSort();
									}
								});
							}
						}
					});
					l.addChild(co.deleteButton);
				}
				if(c.edit && c.add) {
					co.editButton.onClick();
				}
			}
			return co;
		};
		// end render
		controls = array.map(controls,function(c,i){
			if(c.required || !hideOptional || c.hasOwnProperty("value") || c.hasOwnProperty("checked")) {
				if(!c.required && self.allowOptionalDeletion) c["delete"] = true;
			} else {
				c["delete"] = true;
				optional.push(c);
			}
			return c;
		},this);
		optionalSort();
		preload(controls).then(lang.hitch(this,function(){
			var widgets = {};
			controls.forEach(function(c,i){
				if(optional.indexOf(c)==-1) {
					var widget = render(c);
					if(widget) widgets[c.name] = widget;
				}
			});
			this.layout && this.layout();
			if((hideOptional && optional.length) || this.allowFreeKey) {
				function addSelect(optional){
					var props = {
						store: new Memory({
							data:optional
						}),
						searchAttr:"name",
						labelType:"html",
						labelFunc:function(item,store){
							var label = item.name;
							if(item.description) label = "<div title=\""+item.description+"\">"+label+"</div>";
							return label;
						},
						onChange:function(val){
							var index = -1;
							array.forEach(optional,function(c,i) {
								if(c.name==val) {
									index = i;
								}
							});
							if(index>-1) {
								var cs = optional.splice(index,1);
								preload(cs).then(function(){
									render(cs[0]).focus();
									
								});
							} else if(self.allowFreeKey) {
								// in case there are no optionals, just create new
								// textbox control with entered val as its name
								// force edit/delete so it will be rendered as editable
								var c = {
									type:"input",
									name:val,
									placeHolder:val.toProperCase(),
									label:val.toProperCase()
								};
								if(self.editControls || controller.editControls) {
									c["delete"] = c.edit = c.add = true;
									// TODO: set editControls on data
									c.editControls = self.editControls || controller.editControls;
									// instantiate properties if undef
									if(!controller.item.properties) controller.item.properties = {};
									controller.item.properties[val] = {};
								}
								preload([c]).then(function(){
									render(c);
								});
							}
							this.destroyRecursive();
							add.set("disabled",false);
							self.addChild(add);
						}
					};
					var select;
					if(self.allowFreeKey) {
						select = new ComboBox(props);
						self.addChild(select);
					} else {
						select = new FilteringSelect(props);
						self.addChild(select);
					}
				}
				// FIXME add is global
				add = new Button({
					label:"Add optional property",
					showLabel:false,
					iconClass:"dijitEditorIcon dformaAddIcon",
					onClick:function(){
						this.set("disabled",true);
						addSelect(optional);
					}
				});
				self.addChild(add);
			}
			dd.resolve(widgets);
		}));
		if(this.submitButton) this.submitButton.destroy();
		if(this.cancelButton) this.cancelButton.destroy();
		if(this.submittable) {
			this.submitButton = new Button(lang.mixin({
				label:common.buttonSubmit,
				"class":"dformaSubmit",
				onClick:lang.hitch(this,this.submit)
			},config.submit)).placeAt(this.buttonNode);
		}
		if(this.cancellable) {
			this.cancelButton = new Button(lang.mixin({
				label:common.buttonCancel,
				"class":"dformaCancel",
				onClick:lang.hitch(this,this.cancel)
			},config.cancel)).placeAt(this.buttonNode);
		}
		return dd;
	},
	_processChildren:function(oldVal,newVal){
		var d = new Deferred();
		// FIXME should we getChildren every time?
		// it means we have to track what was rendered async...
		var children = this.getChildren();
		// map for labels
		var toResolve = {};
		children = children.map(function(_){
			return (_ instanceof Label) ? _.child : _;
		});
		children.forEach(function(_){
			if(_._config && _._config.storeParams && _._config.storeParams.target){
				toResolve[_.name] = _._config;
			}
		});
		var resolved = {};
		for(var k in toResolve){
			if(!oldVal || oldVal[k]!=newVal[k]) {
				var config = toResolve[k];
				var query = substitute(config.storeParams.queryString,newVal,[]);
				var href = config.storeParams.target + "?" + query;
				var req = {
					handleAs:"json",
					headers:{
						accept:"application/json"
					}
				};
				var p = config.schema;
				if(p.type=="string" && p.format=="xhtml") {
					// shouldn't we try to resolve XML?
					req = {
						handleAs:"text",
						failOk:true
					};
				}
				console.log("Link "+href+" for "+k+" will be resolved.");
				toResolve[p.rel] = href;
				resolved[p.rel] = resolveCache[href] ? 
					new Deferred().resolve(resolveCache[href]) : request(href,req);
			}
		}
		all(resolved).then(function(res){
			for(var k in res){
				resolveCache[toResolve[k]] = res[k];
				newVal[k]=res[k];
			}
			d.resolve(newVal);
			children.forEach(function(widget){
				// force set child value to retain it
				if(widget.name in res){
					widget.set("value",res[widget.name]);
				}
				var config = widget._config;
				if(!config) return;
				if(config.storeParams && config.storeParams.queryString){
					// each component with a store with queryString
					// should be updated when parent changes
					// dirty hack: only if type=string
					if(typeof widget.query == "string") {
						widget.set("query", substitute(config.storeParams.queryString,newVal,[widget.name]));
					}
				}
				if(config.triggers){
					// each component with trigger should be updated
					// when the target property changes
					config.triggers.forEach(function(trigger){
						var val = trigger.select ? newVal[trigger.select] : newVal;
						if(val){
							trigger.value = val;
							if(trigger.rel){
								var rel = trigger.rel;
								var relProp = trigger.foreignKey || "id";
								var relValue = newVal[rel];
								// rql: Color/?id={color}&values(code)
								// if trigger has rel, use it
								// and assume that it's resolved
								if(relValue && relValue instanceof Array) {
									var obj = relValue.filter(function(_){
										return _.id==trigger.value;
									}).pop();
									val = obj ? obj[relProp] : null;
								} else {
									// don't update
									val = null;
								}
							}
							if(val){
								// default to value
								var prop = trigger.property || "value";
								var target = trigger.target ? 
									lang.getObject(trigger.target,false,this) : this;
								try {
									if(trigger.setter){
										target[trigger.setter](prop,val);
									} else {
										target[prop] = val;
									}
								} catch(err){
									console.error("trigger error",err);
								}
							}
						}
					},widget);
				}
			});
		});
		return d;
	},
	_onChildChange: function(/*String*/ attr){
		// summary:
		//		Called when child's value or disabled state changes

		// The unit tests expect state update to be synchronous, so update it immediately.
		if(!attr || attr == "state" || attr == "disabled"){
			this._set("state", this._getState());
		}

		// Use defer() to collapse value changes in multiple children into a single
		// update to my value.   Multiple updates will occur on:
		//	1. Form.set()
		//	2. Form.reset()
		//	3. user selecting a radio button (which will de-select another radio button,
		//		 causing two onChange events)
		if(!attr || attr == "value" || attr == "disabled" || attr == "checked"){
			if(this._onChangeDelayTimer){
				this._onChangeDelayTimer.remove();
			}
			this._onChangeDelayTimer = this.defer(function(){
				delete this._onChangeDelayTimer;
				this._processChildren(this.value,this.get("value")).then(lang.hitch(this,function(newVal){
					this._set("value", newVal);
				}));
			}, 20);
		}
	},
	startup:function(){
		if(this._started) return;
		config = this[this.configProperty];
		this.submitButton = new Button();
		if(this.cancellable) this.cancelButton = new Button();
		this.inherited(arguments);
		// add default watcher for some child properties
		if(config) {
			return this.rebuild();
		} else {
			return new Deferred().resolve();
		}
	}
});
return Builder;
});