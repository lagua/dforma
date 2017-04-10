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
	"dijit/form/TextBox",
	"dijit/Dialog",

	"dexist/CollectionBrowser"
],function(declare,lang,array,domConstruct,domClass,
	i18n,
	_FormValueWidget,_Contained,_Container,Button,TextBox,Dialog,
	CollectionBrowser){

	return declare("dforma.FolderPicker",[_FormValueWidget,_Contained,_Container],{
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
		postCreate:function(){
			this.inherited(arguments);
			var directory = this.directory.replace(/\\/g,"/");
			this.dialog = new Dialog({
				onShow:lang.hitch(this,function(){
					this.browser.refresh();
				})
			});
			this.browser = new CollectionBrowser({
				style:"width:800px;height:600px",
				target:this.target,
				collectionRoot:"",
				collection:directory,
				rootId:directory,
				selectionMode:"single",
				useDialog:true,
				filter:{isCollection:true},
				useTools:false,
				useRangeHeaders:false,
				display:this.display,
				showPermissions:false,
				onSubmit:lang.hitch(this,function(sel){
					this.input.set("value",sel[0]);
					this.dialog.hide();
				})
			});
			this.browser.placeAt(this.dialog.containerNode);
        	this.browser.startup();
			this.input = new TextBox({
				value:this.value
			});
			this.button = new Button({
				label:"Select folder",
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
