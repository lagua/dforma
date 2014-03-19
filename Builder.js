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
	"dojox/mobile/i18n",
	"dijit/Dialog",
	"dijit/form/Form",
	"dijit/form/_FormValueWidget",
	"dijit/form/Button",
	"dijit/form/FilteringSelect",
	"dijit/form/ComboBox",
	"dijit/form/TextBox",
	"dlagua/x/dtl/filter/strings",
	"dlagua/c/string/toProperCase",
	"dojox/validate/web",
	"dojox/validate/us",
	"dojo/i18n!./nls/common"
],function(require,declare,lang,array,aspect,Deferred,when,all,keys,number,domConstruct,domClass,Memory,_GroupMixin,Group,Label,jsonschema,i18n,Dialog,Form,_FormValueWidget,Button,FilteringSelect,ComboBox,TextBox,strings,toProperCase){

var common = i18n.load("dforma","common");
	
var Builder = declare("dforma.Builder",[_GroupMixin,Form],{
	baseClass:"dformaBuilder",
	templateString: "<div aria-labelledby=\"${id}_label\"><div class=\"dijitReset dijitHidden ${baseClass}Label\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></div><form class=\"dformaBuilderForm\" data-dojo-attach-point='containerNode' data-dojo-attach-event='onreset:_onReset,onsubmit:_onSubmit' ${!nameAttrSetting}></form><div class=\"dijitReset dijitHidden ${baseClass}Hint\" data-dojo-attach-point=\"hintNode\"></div><div class=\"dijitReset dijitHidden ${baseClass}Message\" data-dojo-attach-point=\"messageNode\"></div><div class=\"dijitReset ${baseClass}ButtonNode\" data-dojo-attach-point=\"buttonNode\"></div></div>",
	controller:null,
	controllerWidget:null,
	data:null,
	store:null,
	cancellable:false,
	hideOptional:false,
	allowFreeKey:false, // schema editor: set true for add
	allowOptionalDeletion:false, // schema editor: set false for edit/delete
	addControls:null, // schema editor: set as controls for the editor 
	submit:function(){},
	cancel:function(){},
	onSubmit:function(e) {
		this.submit();
		return false;
	},
	focus: function(){
		// no matter
	},
	_addEditForm:function(c,controller){
		var item = controller.item;
		var props = item.properties;
		var self = this;
		var id = item.id;
		var bools = [];
		for(var k in props) {
			if(c.name==k) {
				array.forEach(c.controls,function(ctrl,i){
					if(ctrl.type=="checkbox") {
						bools.push(ctrl.name);
						c.controls[i].checked = props[k][ctrl.name];
					} else if(ctrl.type=="multiselect_freekey") {
						var ops = [];
						array.forEach(props[k][ctrl.name],function(op){
							ops.push({value:op,label:op,selected:true});
						});
						c.controls[i].options = ops;
					} else {
						c.controls[i].value = props[k][ctrl.name];
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
										data[k][i] = (v=="on" ? true : false);
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
						controls:c.controls,
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
		function render(c,i,controls,Widget,parent) {
			var d = new Deferred();
			if(!parent) parent = self;
			if(!Widget) {
				var req;
				switch(c.type) {
					case "date":
						req = "dijit/form/DateTextBox";
					break;
					case "repeat":
						req = "dforma/Repeat";
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
					case "list":
						req = "dforma/List";
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
						req = "dojox/widget/ColorPicker";
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
						if(c.required || c.type=="email" || c.type=="phone") {
							req = "dijit/form/ValidationTextBox";
						} else {
							req = "dijit/form/TextBox";
						}
					break;
				}
				if(!parent._reqs) parent._reqs = [];
				parent._reqs[i] = {
					req:req,
					control:c
				};
				if(i>=controls.length-1) {
					var reqs = array.map(parent._reqs,function(_){ return _.req });
					require(reqs,function(){
						array.forEach(arguments,function(Widget,index){
							var item = parent._reqs[index];
							render(item.control,index,controls,Widget,parent);
							if(!d.isResolved()) d.resolve();
						});
						delete parent._reqs;
					});
				}
				return d;
			}
			d.resolve();
			var lbl = c.title ? c.title : c.name.toProperCase();
			c = lang.mixin({
				placeHolder:lbl,
				label:lbl,
				"class": "dformaElementName-"+c.name
			},c);
			var co,l,edit,del;
			if(c.edit===true || c["delete"]===true) {
				l = new Label({
					label:c.title ? c.title : c.label,
					title:c.description ? c.description : c.label
				});
				parent.addChild(l);
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
					edit = new Button({
						label:"Edit",
						control:c,
						controller:controller,
						showLabel:false,
						iconClass:"dijitEditorIcon dformaEditIcon",
						onClick:function(){
							var fb = self._addEditForm(this.control,this.controller);
							l.addChild(fb);
							var _sh, _ch;
							function end(){
								if(_sh) _sh.remove();
								if(_ch) _ch.remove();
								edit.destroyRecursive();
								if(del) del.destroyRecursive();
								if(this.control.add && add) {
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
					l.addChild(edit);
				}
				if(c["delete"]) {
					del = new Button({
						label:"Delete",
						showLabel:false,
						iconClass:"dijitEditorIcon dformaDeleteIcon",
						onClick:function(){
							var item = controller.item;
							var props = item.properties;
							var id = item.id;
							var fromOptions = props!==undefined;
							for(var k in props) {
								if(c.name==k) {
									delete props[k];
									if(self.store) when(self.store.put({id:id,properties:props},{incremental:true}),function(res){
									},function(err){
										if(self.store.onError) self.store.onError(err,"put",{id:id,properties:props},{incremental:true});
									});
									break;
								}
							}
							var index = -1;
							array.forEach(controller.item.controls,function(ctrl,i){
								if(c.name==ctrl.name) {
									index = i;
									if(!fromOptions) {
										// reset value!
										ctrl.widget.set("value",null);
										// push back up stack
										optional.push(c);
									}
								}
							});
							// item could be not in controller
							if(self.allowOptionalDeletion) {
								array.forEach(controls,function(ctrl,i){
									if(c.name==ctrl.name) {
										index = i;
									}
								});
							}
							if(index>-1) {
								if(fromOptions) {
									controller.item.controls.splice(index,1);
									if(edit) edit.destroyRecursive();
									del.destroyRecursive();
									self.rebuild();
								} else {
									l.destroyRecursive();
								}
							}
						}
					});
				}
				if(c["delete"] && !self.allowOptionalDeletion) {
					l.addChild(del);
					return d;
				}
				if(c.add) {
					edit.onClick();
					return d;
				}
			}
			if(c.widget) c.widget = null;
			var cc = lang.mixin({},c);
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
					cc.labelAttr = "title";
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
						var data = this.store.get(id);
						domClass.toggle(this.domNode,"dijitHidden",true);
						domClass.toggle(parent.buttonNode,"dijitHidden",true);
						domClass.toggle(parent.hintNode,"dijitHidden",true);
						domClass.toggle(this.subform.domNode,"dijitHidden",false);
						this.subform.rebuild({
							id:id,
							options:options,
							// TODO: create type for items instanceof array
							controls:[jsonschema.schemasToControl(c.controller.name,c.schema.items,data,{
								selectFirst:true,
								controllerType:c.controller.type
							})],
							submit:{
								label:common.buttonSave
							}
						});
					};
				break;
				case "group":
					cc.item = c.options[0];
					cc.hint = c.description || "";
				break;
				case "email":
					cc.validator = dojox.validate.isEmailAddress;
				break;
				case "phone":
					cc.validator = dojox.validate.us.isPhoneNumber;
				break;
				case "unhidebutton":
					var label = c.label.split("|");
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
						searchAttr:"id",
						labelAttr:"id",
						autoComplete:true
					},cc);
				break;
				case "switch":
				break;
				default:
				break;
			}
			co = new Widget(cc);
			if(c.controller) {
				controller = co;
				self.controllerWidget = controller;
			}
			if(controls[i]) controls[i].widget = co;
			if(c.type=="list") {
				parent.addChild(co);
				cc.subform.parentform = co;
				parent.addChild(cc.subform);
				console.warn("subform added")
			} else if(c.type=="repeat" || c.type=="group"){
				parent.addChild(co);
				array.forEach(c.options,function(o){
					if(o.controls) {
						array.forEach(o.controls,function(c,i){
							render(c,i,o.controls,null,co);
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
			} else if(c["delete"]) {
				l.addChild(co);
				l.addChild(del);
				//l.startup();
			} else {
		 		l = new Label({
					label:c.label,
					"class":"dformaLabelFor"+c.type.toProperCase(),
					child:co,
					title:c.description /*&& !c.schema.dialog*/ ? c.description : c.label
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
				/*
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
				*/
			}
			if(i == controls.length-1) parent.layout && parent.layout();
			return d;
		};
		// end render
		var res = array.map(controls,lang.hitch(this,function(c,i){
			var d = new Deferred();
			c = lang.mixin({
				onChange:function(){
					if(c.type=="checkbox") this.value = (this.checked === true);
					controls[i].value = this.value;
					if(c.controller) {
						self.rebuild();
					}
				}
			},c);
			if(c.required || !hideOptional || c.hasOwnProperty("value") || c.hasOwnProperty("checked")) {
				if(!c.required && self.allowOptionalDeletion) c["delete"] = true;
				render(c,i,controls,null,this).then(function(){
					d.resolve();
				});
			} else {
				c["delete"] = true;
				optional.push(c);
				d.resolve();
			}
			return d;
		}));
		all(res,lang.hitch(this,function(){
			if((hideOptional && optional.length) || this.allowFreeKey) {
				function addSelect(optional){
					var props = {
						store: new Memory({
							idProperty:"name",
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
									render(c,i,controls);
								}
							});
							if(index>-1) {
								optional.splice(index,1);
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
								if(self.addControls || controller.addControls) {
									c.edit = true;
									c.add = true;
									// TODO: set addControls on data
									c.controls = self.addControls || controller.addControls;
									// instantiate properties if undef
									if(!controller.item.properties) controller.item.properties = {};
									controller.item.properties[val] = {};
								}
								render(c,0,[]);
							}
							this.destroyRecursive();
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
		}));
		this.submitButton.destroy();
		if(this.cancellable) this.cancelButton.destroy();
		this.submitButton = new Button(lang.mixin({
			label:common.buttonSubmit,
			"class":"dformaSubmit",
			onClick:lang.hitch(this,this.submit)
		},this.data.submit)).placeAt(this.buttonNode);
		if(this.cancellable) {
			this.cancelButton = new Button(lang.mixin({
				label:common.buttonCancel,
				"class":"dformaCancel",
				onClick:lang.hitch(this,this.cancel)
			},this.data.cancel)).placeAt(this.buttonNode);
		}
	},
	startup:function(){
		if(this._started) return;
		this.submitButton = new Button();
		if(this.cancellable) this.cancelButton = new Button();
		this.inherited(arguments);
		if(this.data) this.rebuild();
	}
});
return Builder;
});