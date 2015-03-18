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
		fetchTemplate:function(path){
			if(path) this.templatePath = path;
			if(!this.templatePath || !this.templateExtension) {
				setTimeout(lang.hitch(this,"onTemplate"),1);
			} else {
				request(this.templatePath+this.templateExtension).then(lang.hitch(this,function(tpl){
					if(tpl) {
						this.template = tpl;
						if(!this.writer) {
							this.writer = new mustache.Writer();
							this.tokens = this.writer.parse(tpl);
						}
					}
					this.onTemplate();
				}),lang.hitch(this,function(err){
					this.onTemplate();
				}));
			}
		},
		onTemplate:function(){
			// override
		},
		renderTemplate:function(){
			if(!this.writer) return;
			var context = new mustache.Context(object);
			return this.writer.renderTokens(this.tokens,context,this.partials,this.template);
		}
	});
});