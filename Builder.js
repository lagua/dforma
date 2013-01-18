dojo.provide("dforma.Builder");

dojo.require("dforma.Group");
dojo.require("dforma.Label");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.Form");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dijit.form.MultiSelect");
dojo.require("dijit.form.ComboBox");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dijit.form.CheckBox");
dojo.require("dlagua.x.dtl.filter.strings");
dojo.require("dlagua.c.string.toProperCase");
dojo.require("dijit._Container");

dojo.require("dojo.store.Memory");
dojo.require("dojo.data.ObjectStore");

dojo.declare("dforma.Builder", [dijit._Container,dijit.form.Form], {
	baseClass:"dformaBuilder",
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
			type:"select",
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
		dojo.forEach(schemaList,function(schema){
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
				// more possible types?
				// TODO: add array type /w options for select
				// TODO: add default values (for reference only)
				var type = prop.type=="boolean" ? "checkbox" : "input";
				if(dojo.isArray(prop["enum"]) && prop["enum"].length) {
					type = "select";
				}
				var c = {
					name:k,
					type:type,
					required:(prop.required===true)
				};
				if(type=="select") {
					c.options = [];
					dojo.forEach(prop["enum"],function(op) {
						c.options.push({id:op});
					});
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
					if(type=="checkbox") {
						c.checked = data[k]==true;
					} else {
						c.value = data[k];
					}
				} else if(prop.hasOwnProperty("default")) {
					if(type=="checkbox") {
						c.checked = prop["default"]==true;
					} else {
						c.value = prop["default"];
					}
				}
				option.controls.push(c);
			}
			control.options.push(option);
		});
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
		var maingroup = new dforma.Group();
		this.addChild(maingroup);
		var controls = this.data.controls;
		var controller;
		var self = this;
		// get the controls of the current controller selection 
		dojo.forEach(controls,function(c){
			if(c.controller) {
				self.controller = c;
				dojo.forEach(c.options,function(o){
					if(o.id==c.value && o.controls) controls = controls.concat(o.controls);
				});
			}
		});
		var optional = [];
		var hideOptional = this.hideOptional;
		function render(c,i,controls) {
			var co,l,edit,del;
			if(c.edit || c["delete"]) {
				l = new dforma.Label({
					label:c.label+":",
					title:c.description || c.label,
					style:"display:block;margin:5px"
				});
				maingroup.addChild(l);
				if(!self.allowOptionalDeletion && c.description) {
					dojo.create("span",{
						innerHTML:dlagua.x.dtl.filter.strings.truncatewords_html(c.description,{
							words:8
						}),
						title:c.description,
						"class":"dijitReset dijitInline dijitButtonText"
					},l.domNode);
				}
				if(c.edit) {
					edit = new dijit.form.Button({
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
									dojo.forEach(c.controls,function(ctrl,i){
										if(ctrl.type=="checkbox") {
											bools.push(ctrl.name);
											c.controls[i].checked = props[k][ctrl.name];
										} else if(ctrl.type=="multiselect_freekey") {
											var ops = [];
											dojo.forEach(props[k][ctrl.name],function(op){
												ops.push({value:op,label:op,selected:true});
											});
											c.controls[i].options = ops;
										} else {
											c.controls[i].value = props[k][ctrl.name];
										}
									});
									// TODO: insert a subform
									var fb = new dforma.Builder({
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
												if(dojo.isArray(data[k])) {
													if(dojo.indexOf(bools,k)>-1) {
														dojo.forEach(data[k],function(v,i){
															data[k][i] = (v=="on" ? true : false);
														});
														if(data[k].length==0) {
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
												controller.item.controls.push(dojo.mixin(c,data));
											}
											if(self.store) dojo.when(self.store.put({id:id,properties:props},{incremental:true}),function(res){
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
					del = new dijit.form.Button({
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
									if(self.store) dojo.when(self.store.put({id:id,properties:props},{incremental:true}),function(res){
									},function(err){
										if(self.store.onError) self.store.onError(err,"put",{id:id,properties:props},{incremental:true});
									});
									break;
								}
							}
							var index = -1;
							dojo.forEach(controller.item.controls,function(ctrl,i){
								if(c.name==ctrl.name) {
									index = i;
									if(!fromOptions) optional.push(c);
								}
							});
							// item could be not in controller
							if(self.allowOptionalDeletion) {
								dojo.forEach(controls,function(ctrl,i){
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
			switch(c.type) {
				case "input":
				case "password":
				case "hidden":
					if(c.required) {
						co = new dijit.form.ValidationTextBox(c);
					} else {
						co = new dijit.form.TextBox(c);
					}
				break;
				case "date":
					dj.require("dijit.form.DateTextBox");
					co = new dijit.form.DateTextBox(c);
				break;
				case "checkbox":
					c.checked = (c.value==true);
					co = new dijit.form.CheckBox(c);
				break;
				case "select":
					co = new dijit.form.FilteringSelect(dojo.mixin({
						store: new dojo.data.ObjectStore({
							objectStore: new dojo.store.Memory({
								data:c.options
							})
						}),
						searchAttr:"id",
						labelAttr:"id",
						autoComplete:true
					},c));
					break;
				case "combo":
					co = new dijit.form.ComboBox(dojo.mixin({
						store: new dojo.data.ObjectStore({
							objectStore: new dojo.store.Memory({
								data:c.options
							})
						}),
						searchAttr:"id",
						labelAttr:"id",
						autoComplete:true
					},c));
					break;
				case "multiselect":
				case "multiselect_freekey":
					co = new dforma.MultiSelect(c);
				break;
				case "colorpicker":
					dj.require("dojox.widget.ColorPicker");
					co = new dojox.widget.ColorPicker(c);
				break;
				case "color":
					dj.require("dforma.ColorPaletteBox");
					co = new dforma.ColorPaletteBox(c);
				break;
				case "colorpalette":
					dj.require("dlagua.w.ColorPalette");
					co = new dlagua.w.ColorPalette(c);
				break;
				case "switch":
					
				break;
				default:
				break;
			}
			if(c.controller) {
				controller = co;
				self.controllerWidget = controller;
			}
			controls[i].widget = co;
			if(c.type=="hidden") {
				maingroup.addChild(co);
			} else if(c["delete"]) {
				l.addChild(co);
				l.addChild(del);
				//l.startup();
			} else {
				l = new dforma.Label({
					label:c.label+":",
					child:co,
					title:c.description || c.label,
					style:"display:block;margin:5px"
				});
				if(c.type=="multiselect_freekey") {
					l.child = null;
					l.addChild(co);
					l.addChild(new dijit.form.TextBox({
						onChange:function(val){
							if(val) co.addOption({value:val,label:val,selected:true});
							this.set("value","");
						},
						onBlur:function(){
							this.onChange(this.value);
						},
						onKeyPress:function(e) {
							if(e.charOrCode==dojo.keys.ENTER) {
								this.focusNode.blur();
							}
						}
					}));
				}
				maingroup.addChild(l);
			} 
		}
		dojo.forEach(controls,function(c,i){
			c = dojo.mixin({
				placeHolder:c.name.toProperCase(),
				label:c.name.toProperCase(),
				onChange:function(){
					if(c.type=="checkbox") this.value = (this.checked == true);
					controls[i].value = this.value;
					if(c.controller) {
						self.rebuild();
					}
				}
			},c);
			if(c.required || !hideOptional || c.hasOwnProperty("value") || c.hasOwnProperty("checked")) {
				if(!c.required && self.allowOptionalDeletion) c["delete"] = true;
				render(c,i,controls);
			} else {
				c["delete"] = true;
				optional.push(c);
			}
		});
		if(((hideOptional && optional.length) || this.allowFreeKey) && controller && controller.get("value")) {
			var select;
			function addSelect(){
				var props = {
					store: new dojo.data.ObjectStore({
						objectStore: new dojo.store.Memory({
							idProperty:"name",
							data:optional
						})
					}),
					searchAttr:"name",
					labelType:"html",
					labelFunc:function(item,store){
						var label = store.getValue(item, "name");
						if(item.description) label = "<div title=\""+item.description+"\">"+label+"</div>";
						return label;
					},
					onChange:function(val){
						add.set("disabled",false);
						var isOption = false;
						var index = -1;
						dojo.forEach(optional,function(c,i) {
							if(c.name==val) {
								isOption = true;
								index = i;
								render(c,i,controls);
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
							render(c,i,controls);
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
					select = new dijit.form.ComboBox(props);
					self.addChild(select);
				} else {
					select = new dijit.form.FilteringSelect(props);
					self.addChild(select);
				}
			}
			var add = new dijit.form.Button({
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
		var cancel = new dijit.form.Button(dojo.mixin({
			label:"Cancel",
			style:"float:right;margin-top:-10px;",
			onClick:dojo.hitch(this,this.cancel)
		},this.data.cancel));
		this.addChild(cancel);
		var submit = new dijit.form.Button(dojo.mixin({
			label:"Ok",
			style:"float:right;margin-top:-10px;",
			onClick:dojo.hitch(this,this.submit)
		},this.data.submit));
		this.addChild(submit);
	},
	startup:function(){
		if(this.data) this.rebuild();
		this.inherited(arguments);
	}
});