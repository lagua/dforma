define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/when",
	"dojo/keys",
	"dojo/dom-construct",
	"dojo/store/Memory",
	"./Group",
	"./Label",
	"dojo/i18n!./nls/common",
	"dijit/_Container",
	"dijit/form/Form",
	"dijit/form/Button",
	"dijit/form/FilteringSelect",
	"dijit/form/ComboBox",
	"dijit/form/TextBox",
	"dlagua/x/dtl/filter/strings",
	"dlagua/c/string/toProperCase"
],function(declare,lang,array,when,keys,domConstruct,Memory,Group,Label,common,_Container,Form,Button,FilteringSelect,ComboBox,TextBox,strings,toProperCase){
return declare("dforma.Builder",[_Container,Form],{
	baseClass:"dformaBuilder",
	templateString: "<div><form class=\"dformaBuilderForm\" data-dojo-attach-point='containerNode' data-dojo-attach-event='onreset:_onReset,onsubmit:_onSubmit' ${!nameAttrSetting}></form><div data-dojo-attach-point=\"buttonNode\"></div></div>",
	controller:null,
	controllerWidget:null,
	data:null,
	store:null,
	hideOptional:false,
	allowFreeKey:false,
	allowOptionalDeletion:false,
	submit:function(){},
	cancel:function(){},
	toControl:function(name,schemaList,data,options){
		if(!options) options = {};
		var control = {
			type:options.controllerType || "select",
			required:true,
			controller:true,
			name: name,
			options:[]
		};
		if(options.add) {
			options.edit = true;
			options["delete"] = true;
			this.allowFreeKey = true;
			this.addControls = options.controls;
		}
		if(options.edit || options["delete"]) {
			control.labelAttr = control.searchAttr = "name";
			this.allowOptionalDeletion = false;
		}
		array.forEach(schemaList,function(schema){
			if(schema["default"]) control["default"] = schema[name];
			var option = {
				id:schema[name],
				schema:schema,
				controls:[]
			};
			var properties = schema.properties;
			if(options.edit || options["delete"]) {
				option.name = schema[name];
				option.id = schema["id"];
				option.properties = properties;
			}
			for(var k in properties) {
				var prop = properties[k];
				// TODO: add more types
				var type;
				if(prop.type=="boolean") {
					type = "checkbox";
				} else if(prop.type=="integer") {
					type = "spinner";
				} else if(prop.type=="float") {
					type = "number";
				} else if(prop.type=="date") {
					type = "date";
				} else if(prop.type=="array") {
					type = "repeat";
				} else if(prop.type=="object") {
					type = "group";
				} else if(prop.type=="string" && prop.format=="text"){
					type = "textarea";
				} else {
					type = "input";
				}
				if(lang.isArray(prop["enum"]) && prop["enum"].length) {
					type = "select";
				}
				var c = {
					name:k,
					type:type,
					schema:prop,
					required:(prop.required === true),
					disabled:(prop.readonly === true)
				};
				if(prop.title) {
					c.title = prop.title;
				}
				if(prop.description) {
					c.description = prop.description;
				}
				if(type=="select") {
					c.options = [];
					array.forEach(prop["enum"],function(op) {
						c.options.push({id:op});
					});
				}
				if(type=="repeat" || type=="group"){
					var items = this.toControl(c.name,[{
						properties:type=="repeat"? prop.items : prop.properties
					}],null,{
						controllerType:type
					});
					c = lang.mixin(c,items);
				}
				if(options.edit) {
					c.edit = true;
					c.controls = options.controls;
				}
				if(options["delete"]) c["delete"] = true;
				if(options.description) {
					c.description = properties[k][options.description];
				}
				if(data && data.hasOwnProperty(k)) {
					c.value = data[k];
				} else if(prop.hasOwnProperty("default")) {
					c.value = prop["default"];
				}
				option.controls.push(c);
			}
			control.options.push(option);
		},this);
		if(options.selectFirst) control.value = control.options[0].id;
		return control;
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
		function render(c,i,controls,Widget,parent) {
			var lbl = c.title ? c.title : c.name.toProperCase();
			c = lang.mixin({
				placeHolder:lbl,
				label:lbl
			},c);
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
					case "combo":
						req = "dijit/form/ComboBox";
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
						req = "dforma/Group";
					break;
					case "switch":
					break;
					default:
						if(c.required) {
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
				if(i==controls.length-1) {
					var reqs = array.map(parent._reqs,function(_){ return _.req });
					require(reqs,function(){
						array.forEach(arguments,function(Widget,index){
							var item = parent._reqs[index];
							render(item.control,index,controls,Widget,parent);
						});
						delete parent._reqs;
					});
				}
				return;
			}
			var co,l,edit,del;
			if(c.edit || c["delete"]) {
				l = new Label({
					label:c.title ? c.title : c.label,
					title:c.description ? c.description : c.label
				});
				parent.addChild(l);
				if(!self.allowOptionalDeletion && c.description) {
					domConstruct.create("span",{
						innerHTML:strings.truncatewords_html(c.description,{
							words:8
						}),
						title:c.description,
						"class":"dijitReset dijitInline"
					},l.domNode);
				}
				if(c.edit) {
					edit = new Button({
						label:"Edit",
						controller:controller,
						showLabel:false,
						iconClass:"dijitEditorIcon dformaEditIcon",
						onClick:function(){
							var item = this.controller.item;
							var props = item.properties;
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
											edit.destroyRecursive();
											if(del) del.destroyRecursive();
											self.rebuild();
										},
										data:{
											controls:c.controls,
											submit:{
												label:"Save"
											}
										}
									});
									l.addChild(fb);
									fb.startup();
									break;
								}
							}
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
				if(c.add) edit.onClick();
				if(c["delete"] && !self.allowOptionalDeletion) {
					l.addChild(del);
					return;
				}
			}
			if(c.widget) c.widget = null;
			var cc = lang.mixin({},c);
			switch(c.type) {
				case "checkbox":
					cc.checked = (c.value===true);
				break;
				case "repeat":
					cc.cols = c.options[0].controls.length;
					cc.item = c.options[0];
					cc.hint = c.description || "";
				break;
				case "textarea":
					cc.block = true;
				break;
				case "group":
					cc.item = c.options[0];
					cc.hint = c.description || "";
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
			controls[i].widget = co;
			if(c.type=="repeat" || c.type=="group"){
				parent.addChild(co);
				array.forEach(c.options,function(o){
					if(o.id==c.value && o.controls) {
						array.forEach(o.controls,function(c,i){
							render(c,i,o.controls,null,co);
						});
					}
				});
			} else if(parent.type=="repeat"){
				parent.addControl(Widget,cc);
			} else if(c.type=="hidden") {
				parent.addChild(co);
			} else if(c["delete"]) {
				l.addChild(co);
				l.addChild(del);
				//l.startup();
			} else {
		 		l = new Label({
					label:c.label,
					child:co,
					title:c.description ? c.description : c.label
				});
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
		}
		// end render
		array.forEach(controls,function(c,i){
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
				render(c,i,controls,null,this);
			} else {
				c["delete"] = true;
				optional.push(c);
			}
		},this);
		if(((hideOptional && optional.length) || this.allowFreeKey) && controller && controller.get("value")) {
			var select;
			function addSelect(){
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
						add.set("disabled",false);
						var isOption = false;
						var index = -1;
						array.forEach(optional,function(c,i) {
							if(c.name==val) {
								isOption = true;
								index = i;
								render(c,i,controls,parent);
							}
						});
						if(index>-1) optional.splice(index,1);
						if(!isOption && self.allowFreeKey) {
							var c = {
								type:"input",
								name:val,
								placeHolder:val.toProperCase(),
								label:val.toProperCase()
							};
							if(self.addControls) {
								c.edit = true;
								c.add = true;
								c["delete"] = true;
								c.controls = self.addControls;
								// instantiate properties if undef
								if(!controller.item.properties) controller.item.properties = {};
								controller.item.properties[val] = {};
							}
							render(c,i,controls,parent);
						}
						if(optional.length || self.allowFreeKey) {
							self.addChild(add);
						} else {
							add.destroyRecursive();
						}
						self.addChild(cancel);
						self.addChild(submit);
						this.destroyRecursive();
					}
				};
				if(self.allowFreeKey) {
					select = new ComboBox(props);
					self.addChild(select);
				} else {
					select = new FilteringSelect(props);
					self.addChild(select);
				}
			}
			var add = new Button({
				label:"Add optional property",
				showLabel:false,
				iconClass:"dijitEditorIcon dformaAddIcon",
				onClick:function(){
					this.set("disabled",true);
					addSelect();
				}
			});
			self.addChild(add);
		}
		this.cancelBtn.destroy();
		this.submitBtn.destroy();
		this.cancelBtn = new Button(lang.mixin({
			label:common.buttonCancel,
			"class":"dformaCancel",
			onClick:lang.hitch(this,this.cancel)
		},this.data.cancel)).placeAt(this.buttonNode);
		this.submitBtn = new Button(lang.mixin({
			label:common.buttonSubmit,
			"class":"dformaSubmit",
			onClick:lang.hitch(this,this.submit)
		},this.data.submit)).placeAt(this.buttonNode);
	},
	startup:function(){
		this.cancelBtn = new Button();
		this.submitBtn = new Button();
		if(this.data) this.rebuild();
		this.inherited(arguments);
	}
});
});
