define([
    "require",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/json",
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/request",
	"dojo/currency",
	"dojo/keys",
	"dijit/form/Button",
	"dgrid/OnDemandGrid",
	"dgrid/Keyboard",
	"dgrid/Selection",
	"dgrid/Editor",
	"dgrid/extensions/DijitRegistry",
	"./_ArrayWidgetBase",
	"./_SubFormMixin",
	"./util/i18n",
	"mustache/mustache",
	"rql/js-array"
],function(req,
		declare,lang,djson,domConstruct,domClass,request,currency,dkeys,
		Button, 
		OnDemandGrid, Keyboard, Selection, Editor, DijitRegistry,
		_ArrayWidgetBase,_SubFormMixin,i18n,
		mustache,
		rql){
	
	return declare("dforma.Grid",[_ArrayWidgetBase,_SubFormMixin],{
		baseClass:"dformaGrid",
	 	_parseColumns:function(columns) {
	 		var self = this;
			for(k in columns){
				columns[k].key = k;
				if(columns[k].summary) this.summary = true;
				if(columns[k].template || columns[k].calc || columns[k].widget || columns[k].currency){
					columns[k].renderCell = lang.hitch(columns[k],function(obj,value,node,options) {
						var div = document.createElement("div");
						if(this.select){
							obj = rql.query("select("+this.select+")",{},[obj]).pop();
						}
						if(this.calc) {
							var keys = Object.keys(obj);
							var values = [];
							for(var k in obj) {
							    values.push(obj[k]);
							}
							var f = new Function(keys,"return "+this.calc);
							// update the property
							// FIXME: how to put?
							obj[this.key] = value = f.apply(obj,values);
							//self.store.put(obj);
						}
						if(this.widget){
							var parts = this.widget.split("|");
							var mid = parts.shift().replace(/\./g,"/");
							var props = parts.length ? djson.fromJson(parts.shift()) : {};
							props = lang.mixin(props,{
								value:value,
								onChange:lang.hitch(this,function(val){
									obj[this.key] = val;
									self.store.put(obj,{noop:true});
								}),
								onBlur:function(){
									this.onChange(this.value);
								},
								onKeyPress:function(e) {
									if(e.charOrCode==dkeys.ENTER) {
										this.focusNode.blur();
									}
								}
							});
							req([mid],function(Widget){
								var widget = new Widget(props);
								setTimeout(function(){
									div.innerHTML = "";
									widget.placeAt(div);
									widget.startup();
								},10)
							});
						} else if(this.tpl){
							value = mustache.render(this.tpl,obj);
						} else if(this.template) {
							request(self.templatePath+"_column_"+this.key+self.templateExtension).then(lang.hitch(this,function(tpl){
								this.tpl = tpl;
								div.innerHTML = mustache.render(tpl,obj);
							}));
						} else if(this.currency) {
							value = currency.format(value,this);
						}
						if(this.summary){
							var totals = self.getTotals();
							self.widget.set("summary",totals);
						}
						div.innerHTML = value;
						return div;
					})
				}
			}
			return columns;
		},
		getTotals:function () {
			var totals = {};
			var data = this.store.fetchSync();
			var k;
			for(k in this.columns){
				if(this.columns[k].summary) totals[k] = 0;
			}
			for(var i = 0,l = data.length; i<l; i++) {
				for(k in totals){
					totals[k] += data[i][k];
				}
			}
			for(k in this.columns){
				if(this.columns[k].summary && this.columns[k].currency){
					totals[k] = currency.format(totals[k],this.columns[k]);
				} else if(this.columns[k].summaryTitle){
					totals[k] = "Totaal";
				}
			}
			return totals;
		},
	 	attachWidget:function(){
			var Widget = declare([OnDemandGrid, Keyboard, Selection, Editor, DijitRegistry],{
	            buildRendering: function () {
	                this.inherited(arguments);
	                var areaNode = this.summaryAreaNode =
	                    domConstruct.create('div', {
	                        className: 'summary-row',
	                        role: 'row',
	                        style: { overflow: 'hidden' }
	                    }, this.footerNode);
	     
	                // Keep horizontal alignment in sync
	                this.on('scroll', lang.hitch(this, function () {
	                    areaNode.scrollLeft = this.getScrollPosition().x;
	                }));
	     
	                // Process any initially-passed summary data
	                if (this.summary) {
	                    this._setSummary(this.summary);
	                }
	            },
	            _updateColumns: function () {
	                this.inherited(arguments);
	                if (this.summary) {
	                    // Re-render summary row for existing data,
	                    // based on new structure
	                    this._setSummary(this.summary);
	                }
	            },
	            _renderSummaryCell: function (item, cell, column) {
	                // summary:
	                //      Simple method which outputs data for each
	                //      requested column into a text node in the
	                //      passed cell element.  Honors columns'
	                //      get, formatter, and renderCell functions.
	                //      renderCell is called with an extra flag,
	                //      so custom implementations can react to it.
	     
	                var value = item[column.field] || '';
	                cell.appendChild(document.createTextNode(value));
	            },
	            _setSummary: function (data) {
	                // summary:
	                //      Given an object whose keys map to column IDs,
	                //      updates the cells in the footer row with the
	                //      provided data.
	     
	                var tableNode = this.summaryTableNode;
	     
	                this.summary = data;
	     
	                // Remove any previously-rendered summary row
	                if (tableNode) {
	                    domConstruct.destroy(tableNode);
	                }
	     
	                // Render summary row
	                // Call _renderSummaryCell for each cell
	                tableNode = this.summaryTableNode =
	                    this.createRowCells('td',
	                        lang.hitch(this, '_renderSummaryCell', data));
	                this.summaryAreaNode.appendChild(tableNode);
	     
	                // Force resize processing,
	                // in case summary row's height changed
	                if (this._started) {
	                    this.resize();
	                }
	            }
	 		});
			var totals = this.getTotals();
			var gridParams = {
				columns:this.gridColumns,
				showFooter:(this.add || this.edit || this.remove || this.summary),
				collection:this.store,
				selectionMode:"single",
				summary:totals
			};
			this.widget = new Widget(gridParams);
			this.addChild(this.widget);
			this.addButton && this.addButton.placeAt(this.widget.footerNode);
			this.editButton && this.editButton.placeAt(this.widget.footerNode);
			this.removeButton && this.removeButton.placeAt(this.widget.footerNode);
			var selected = 0;
			this.own(
				this.widget.on("dgrid-select", lang.hitch(this,function(e){
					selected += e.rows.length;
					if(this.edit && !this.readonly) this.editButton.set("disabled", !selected);
					if(this.remove) this.removeButton.set("disabled", !selected);
				})),
				this.widget.on("dgrid-deselect", lang.hitch(this,function(e){
					selected -= e.rows.length;
					if(this.edit && !this.readonly) this.editButton.set("disabled", !selected);
					if(this.remove) this.removeButton.set("disabled", !selected);
				}))
			);
			this.widget.resize();
	 	},
		postCreate:function(){
			// parse column expressions:
			this.gridColumns = this._parseColumns(lang.mixin({},this.params.columns));
			if(this.summary) this.add = this.edit = this.remove = false;
			var common = i18n.load("dforma","common");
			if(this.edit){
				this.editButton = new Button({
					label:common.buttonEditSelected,
					disabled:true,
					"class": this.baseClass+"EditButton",
					onClick:lang.hitch(this,function(){
						this.editSelected();
					})
				});
			}
			if(this.remove){
				this.removeButton = new Button({
					label:common.buttonRemoveSelected,
					disabled:true,
					"class": this.baseClass+"RemoveButton",
					onClick:lang.hitch(this,function(){
						this.removeSelected();
					})
				});
			}
			this.inherited(arguments);
		},
		addItem:function(){
			this.store.add(lang.clone(this.defaultInstance)).then(lang.hitch(this,function(data){
				var id = data.id;
				this.newdata = true;
				this.widget.select(id);
				this.onEdit(id);
			}));
		},
		onEdit:function(id,options){
			// override to edit
			this.inherited(arguments);
		},
		editSelected:function(){
			if(this.widget.selection.length>1) return; 
			for(var id in this.widget.selection) {
				if(this.widget.selection[id]) {
					this.onEdit(id,{
						overwrite:true
					});
				}
			}
		},
		removeSelected:function(){
			for(var id in this.widget.selection) {
				if(this.widget.selection[id]) this.store.remove(id);
			}
			this.widget.refresh();
		}
	});
});