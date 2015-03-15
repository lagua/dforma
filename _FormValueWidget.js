define([
	"dojo/_base/declare", // declare
	"dijit/_WidgetBase",
	"dijit/_FocusMixin",
	"dijit/_CssStateMixin",
	"dijit/_TemplatedMixin",
	"dijit/form/_FormWidgetMixin"
], function(declare, _WidgetBase, _FocusMixin, _CssStateMixin, _TemplatedMixin, _FormWidgetMixin){
	
	return declare([_WidgetBase, _FocusMixin, _CssStateMixin, _TemplatedMixin, _FormWidgetMixin]);
	
});