define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/dom-construct",
	"dojo/dom-class",

	"dforma/util/i18n",

	"dijit/form/_FormValueWidget",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/form/Button",
	"dijit/form/ValidationTextBox",
	"dijit/Dialog",
	"dijit/form/FilteringSelect",

	"dexist/CollectionBrowser"
],function(declare,lang,array,domConstruct,domClass,
	i18n,
	_FormValueWidget,_Contained,_Container,Button,ValidationTextBox,Dialog,FilteringSelect,
	CollectionBrowser){

	return declare("dforma.FilePicker",[_FormValueWidget,_Contained,_Container],{
		templateString:'<div class="dijit dijitReset" id="widget_${id}" role="presentation"><div class="dijitReset" data-dojo-attach-point="focusNode,containerNode"></div></div>',
		directory:"favorites",
		target:"fs",
		dialog:null,
		input:null,
		browser:null,
		value:null,
		button:null,
		display:"details",
		_setDirectoryAttr:function(val){
			if(!this.browser) return;
			this.browser.set("collection",val);
			this.browser.set("rootId",val);
			this.browser.refresh(val);
		},
		validate:function(){
			return this.input.validate();
		},
		postCreate:function(){
			this.inherited(arguments);
			var self = this;
			var directory = this.directory.replace(/\\/g,"/");
			this.dialog = new Dialog({
				onShow:function(){
					self.browser.refresh();
				}
			});
			this.browser = new CollectionBrowser({
				style:"width:800px;height:600px",
				target:this.target,
				editable:false,
				collectionRoot:"",
				collection:directory,
				rootId:directory,
				useTools:false,
				useRangeHeaders:false,
				display:this.display,
				showPermissions:false,
				onSelectResource:lang.hitch(this,function(path){
					this.input.set("value",path);
					this.dialog.hide();
				})
			});
			this.browser.placeAt(this.dialog.containerNode);
        	this.browser.startup();
			this.input = new ValidationTextBox({
				value:this.value,
				required:this.required
			});
			/*if(this.store) {
				this.select = new FilteringSelect({
					store:this.store,
					value:this.directory,
					intermediateChanges: true,
					autocomplete: true,
					onChange:function(){
						self.set("directory",this.get("value"));
					}
				});
				this.select.placeAt(this.containerNode);
			}*/
			this.button = new Button({
				label:"Select file",
				onClick:lang.hitch(this,function(){
					this.dialog.show();
					this.browser.resize();
				})
			});
			this.input.placeAt(this.containerNode);
			this.button.placeAt(this.containerNode);
		},
		_getValueAttr:function(){
			return this.input.get("value");
		},
		_setValueAttr:function(val){
			this.input.set("value",val);
		}
	});
});
