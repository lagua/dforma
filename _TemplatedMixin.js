define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/request",
	"mustache/mustache"
],function(declare,lang,request,mustache){
	return declare("dforma._TemplatedMixin",[],{
		templatePath:"",
		templateExtension:".html",
		writer:null,
		tokens:null,
		partials:null,
		postCreate:function(){
			this.inherited(arguments);
			if(!this.partials) this.partials = {};
			this.fetchTemplate();
		},
		parseTemplate:function(tpl){
			if(tpl) this.template = tpl;
			if(this.template){
				if(!this.writer) {
					this.writer = new mustache.Writer();
				}
				if(!this.tokens){
					this.tokens = this.writer.parse(this.template);
				}
			}
			this.onTemplate();
		},
		fetchTemplate:function(path){
			if(path) this.templatePath = path;
			if(!this.templatePath || !this.templateExtension) {
				setTimeout(lang.hitch(this,"parseTemplate"),1);
			} else {
				request(this.templatePath+this.templateExtension).then(lang.hitch(this,function(tpl){
					this.parseTemplate(tpl);
				}),lang.hitch(this,function(err){
					this.parseTemplate();
				}));
			}
		},
		onTemplate:function(){
			// override
		},
		renderTemplate:function(object){
			if(!this.writer) return;
			var context = new mustache.Context(object);
			return this.writer.renderTokens(this.tokens,context,this.partials,this.template);
		}
	});
});