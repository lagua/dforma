define([
	"dojo/_base/declare",
	"dojo/date/locale",
	"dijit/form/MappedTextBox"
],function(declare,locale,MappedTextBox){
	return declare("dforma.DateTimeTextBox",[MappedTextBox],{
		selector:"date",
		datePattern:"MMMM dd yyyy HH:mm:ss",
		format:function(value){
			return locale.format(new Date(value),this);
		},
		parse:function(value){
			return locale.parse(value,this);
		}
	});
});