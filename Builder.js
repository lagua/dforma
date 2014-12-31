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
	"dojo/store/Memory",
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
	"dforma/util/string/toProperCase",
	"dforma/validate/web",
	"dforma/validate/us",
	"dojo/i18n!./nls/common"
],function(require,declare,lang,array,aspect,Deferred,when,all,keys,number,domConstruct,domClass,Memory,_GroupMixin,Group,Label,jsonschema,i18n,Dialog,Form,_FormValueWidget,Button,FilteringSelect,ComboBox,TextBox,toProperCase){

var common = i18n.load("dforma","common");

var Builder = declare("dforma.Builder",[_GroupMixin,Form],{
	baseClass:"dformaBuilder",
	templateString: "<div aria-labelledby=\"${id}_label\"><div class=\"dijitReset dijitHidden ${baseClass}Label\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></div><form class=\"dformaBuilderForm\" data-dojo-attach-point='containerNode' data-dojo-attach-event='onreset:_onReset,onsubmit:_onSubmit' ${!nameAttrSetting}></form><div class=\"dijitReset dijitHidden ${baseClass}Hint\" data-dojo-attach-point=\"hintNode\"></div><div class=\"dijitReset dijitHidden ${baseClass}Message\" data-dojo-attach-point=\"messageNode\"></div><div class=\"dijitReset ${baseClass}ButtonNode\" data-dojo-attach-point=\"buttonNode\"></div></div>",
	controller:null,
	controllerWidget:null,
	data:null,
	store:null,
	cancellable:false,
	submittable:true,
	hideOptional:false,
	allowFreeKey:false, // schema editor: set true for add
	allowOptionalDeletion:false, // schema editor: set false for edit/delete
	editControls:null, // schema editor: set as controls for the editor
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
				var fb = new Builder({
					style:"height:100%;border:1px solid gray",
					cancel:function(){
						self.rebuild();
					},
					cancellable:true,
					submit:function(){
						if(!this.validate()) return;
						var data = this.get("value");
						console.log(data);
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
	rebuild:function(data){
		var dd = new Deferred();
		if(data) {
			this.data = data;
		} else {
			data = this.data;
		}
		var dj = dojo;
		this.destroyDescendants();
		var controls = this.data.controls;
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
			var reqs = controls.map(function(c){
				var req;
				switch(c.type) {
					case "date":
						req = "dijit/form/DateTextBox";
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
						req = "dijit/form/FilteringSelect";
					break;
					case "textarea":
						req = "dijit/form/Textarea";
					break;
					case "spinner":
						req = "dijit/form/NumberSpinner";
					break;
					case "number":
						req = "dijit/form/NumberTextBox";
					break;
					case "currency":
						req = "dijit/form/CurrencyTextBox";
					break;
					case "combo":
						req = "dijit/form/ComboBox";
					break;
					case "grid":
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
			});
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
					//var name = this.name;
					if(this.type=="checkbox") val = this.value = (this.checked === true);
					// update data controls for
					/*self.data.controls.forEach(function(c){
						if(c.controller && c.options) {
							c.options.forEach(function(op){
								if(op.controls) {
									op.controls.forEach(function(c){
										if(c.name===name) c.value = val;
									});
								}
							});
						}
						if(c.name===name) c.value = val;
					});
					controls.forEach(function(c){
						if(c.name===name) c.value = val;
					});
					*/
					this._config.value = val;
					if(this.controller) {
						this._form.rebuild();
					}
				}
			},c);
			if(c.hasOwnProperty("readonly")) cc.readOnly = c.readonly;
			switch(c.type) {
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
					cc.subform = new Builder({
						cancellable:true,
						cancel: function(){
							domClass.toggle(this.parentform.domNode,"dijitHidden",false);
							domClass.toggle(parent.buttonNode,"dijitHidden",false);
							domClass.toggle(parent.hintNode,"dijitHidden",false);
							domClass.toggle(this.domNode,"dijitHidden",true);
							parent.layout();
							// cancelled new?
							if(this.data && this.data.id && this.parentform.newdata) this.parentform.store.remove(this.data.id);
							this.data = null;
							this.parentform.newdata = false;
						},
						submit: function(){
							if(!this.validate()) return;
							domClass.toggle(this.parentform.domNode,"dijitHidden",false);
							domClass.toggle(parent.buttonNode,"dijitHidden",false);
							domClass.toggle(parent.hintNode,"dijitHidden",false);
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
								id:this.data.id,
								overwrite:true
							});
						}
					});
					var validate = lang.hitch(cc.subform,cc.subform.validate);
					cc.subform.validate = function(){
						if(!this.data) return true;
						return validate();
					};
					parent.own(
						aspect.after(cc.subform,"layout",function(){
							parent.layout();
						}),
						aspect.after(parent,"cancel",function(){
							cc.subform.cancel();
						})
					);
					var _lh = aspect.after(parent,"layout",function(){
						_lh.remove();
						if(co.store && co.store.selectedId) {
							var id = co.store.selectedId;
							co.newdata = co.store.newdata;
							delete co.store.newdata;
							co.store.selectedId = null;
							co.onEdit && co.onEdit(id);
						}
					});
					cc.onEdit = function(id,options){
						options = options || {};
						this.store.get(id).then(lang.hitch(this,function(data){
							domClass.toggle(this.domNode,"dijitHidden",true);
							domClass.toggle(parent.buttonNode,"dijitHidden",true);
							domClass.toggle(parent.hintNode,"dijitHidden",true);
							domClass.toggle(this.subform.domNode,"dijitHidden",false);
							this.subform.rebuild({
								id:id,
								options:options,
								// TODO: create type for items instanceof array
								controls:[jsonschema.schemasToController(c.schema.items,data,{
									selectFirst:true,
									controller:{
										name:c.controller.name,
										type:c.controller.type,
										title:c.controller.title
									}
								})],
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
				case "combo":
					cc = lang.mixin({
						store: new Memory({
							data:c.options
						}),
						searchAttr:c.searchAttr || "id",
						autoComplete:true
					},cc);
				break;
				case "switch":
				break;
				default:
				break;
			}
			if(c.controller) {
				cc._form = parent;
			}
			cc._config = c;
			co = new Widget(cc);
			if(c.controller) {
				controller = parent.controllerWidget = co;
			}
			if(c.type=="grid") {
				parent.addChild(co);
				cc.subform.parentform = co;
				parent.addChild(cc.subform);
				console.warn("subform added")
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
			},this.data.submit)).placeAt(this.buttonNode);
		}
		if(this.cancellable) {
			this.cancelButton = new Button(lang.mixin({
				label:common.buttonCancel,
				"class":"dformaCancel",
				onClick:lang.hitch(this,this.cancel)
			},this.data.cancel)).placeAt(this.buttonNode);
		}
		return dd;
	},
	startup:function(){
		if(this._started) return;
		this.submitButton = new Button();
		if(this.cancellable) this.cancelButton = new Button();
		this.inherited(arguments);
		if(this.data) {
			return this.rebuild();
		} else {
			return new Deferred().resolve();
		}
	}
});
return Builder;
});