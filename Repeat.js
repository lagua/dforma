/*
simple grouping panel for form elements
*/
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojo/dom-construct",
	"dijit/_Widget",
	"dijit/_TemplatedMixin",
	"dijit/_Container",
	"dijit/_Contained",
	"dijit/form/Button"
],function(declare,lang,domStyle,domConstruct,_Widget,_TemplatedMixin,_Container,_Contained,Button){
return declare("dforma.Repeat",[_Widget,_TemplatedMixin,_Container,_Contained],{
	templateString: "<div class=\"dijit dijitReset dformaRepeat\" aria-labelledby=\"${id}_label\"><span style=\"display:none\" class=\"dijitReset dijitInline dformaRepeatLabel\" data-dojo-attach-point=\"labelNode\" id=\"${id}_label\"></span><table id=\"${id}_containerNode\" data-dojo-attach-point=\"repeatNode\"></table><span id=\"${id}_buttonNode\" class=\"dijitReset dformaRepeatButton\" data-dojo-attach-point=\"buttonNode\"></span><span id=\"${id}_messageNode\" class=\"dijitReset dformaRepeatMessage\" data-dojo-attach-point=\"messageNode\"></span></div>",
	label: "",
	cols:1,
	_col:0,
	_row:0,
	_headerNode:null,
	_rowNode:null,
	_rowNodes:null,
	message:"",
	startup:function(){
		if(this.label) domStyle.set(this.id+"_label","display","inline-block");
		domConstruct.create("tr",this.repeatNode);
		this.inherited(arguments);
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
 		if(!this._rowNodes) {
 			this._rowNodes = [];
 			this._rowNodes.push(lang.clone(this._rowNode));
 		}
 		var clone = lang.clone(this._rowNode);
 		this._rowNodes.push(clone);
 		this._row++;
 		domConstruct.place(clone,this.repeatNode);
 	},
 	addChild:function(node,insertIndex){
 		var self = this;
 		if(this._col === 0) {
 			if(this._row==0) {
 				this._headerNode = domConstruct.create("tr",{},this.repeatNode);
 			}
 			this._rowNode = domConstruct.create("tr",{},this.repeatNode);
 		}
 		console.log(this._col,this.cols)
 		if(this._col<this.cols-1) {
 			// add header
 			if(this._row===0){
 				domConstruct.create("th",{
 					"class":"dformaRepeatHeader",
 					"innerHTML":node.label
 				},this._headerNode);
 			}
 		} else {
 			this._row++;
 			this._col = 0;
 		}
 		this.containerNode = domConstruct.create("td",{
 			"class":"dformaRepeatCol"
 		},this._rowNode);
 		if(this._col===0 && this._row==1){
 			new Button({
 				label:"add",
 				onClick:function(){
 					self.cloneRow();
 				}
 			}).placeAt(this.buttonNode);
 			var removeNode = domConstruct.create("td",{
 	 			"class":"dformaRepeatCol"
 	 		},this._rowNode);
 			new Button({
 				label:"Remove",
 				onClick:function(){
 					self.repeatNode.removeChild(this.domNode.parentNode.parentNode);
 				}
 			}).placeAt(removeNode);
 		}
 		this._col++;
 		this.inherited(arguments);
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