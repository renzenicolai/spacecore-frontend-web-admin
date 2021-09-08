const Handlebars = require('handlebars');

class SpacecoreUI {
	constructor( opts ) {
		this._opts = Object.assign({
			"copyrightString": 'Copyright &copy; 2019 Renze Nicolai<br />Theme by codecalm.net'
		}, opts);
		
		Handlebars.registerHelper({
			eq: function (v1, v2) {
				return v1 === v2;
			},
			ne: function (v1, v2) {
				return v1 !== v2;
			},
			lt: function (v1, v2) {
				return v1 < v2;
			},
			gt: function (v1, v2) {
				return v1 > v2;
			},
			lte: function (v1, v2) {
				return v1 <= v2;
			},
			gte: function (v1, v2) {
				return v1 >= v2;
			},
			and: function () {
				return Array.prototype.slice.call(arguments).every(Boolean);
			},
			or: function () {
				return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
			},
			list: function (v1) {
				return Array.isArray(v1);
			},
			string: function (v1) {
				return (typeof v1 === 'string');
			},
			isset: function (v1) {
				return (typeof v1 !== 'undefined');
			},
			isin: function (list, value) {
				return list.includes(value);
			},
			isinobjinlist: function (list, value, key) {
				for (var i in list) {
					var item = list[i];
					if (item[key] === value) return true;
				}
				return false;
			}
		});
		
		Handlebars.registerHelper('decodeAvatar', (avatar) => { return this._decodeAvatar(avatar); });
		
		Handlebars.registerHelper('replaceNewlines', (text) => {
			if (typeof text === "string") {
				text = Handlebars.Utils.escapeExpression(text);
				return new Handlebars.SafeString(text.split("\n").join("<br />"));
			}
			return text;
		});
		
		this.templates = {};
										
		Handlebars.registerPartial('formElement', '{{#if label}}<label class="form-label">{{label}}</label>{{/if}}'
		
								 + '{{#if (or (eq type "text") (eq type "password"))}}{{#if fe_icon}}<div class="input-icon ml-2"><span class="input-icon-addon"><i class="fe fe-{{fe_icon}}"></i></span>{{/if}}<input {{#if (eq disabled true)}}disabled=true {{/if}}{{#if id}}id="{{id}}"{{/if}} {{#if name}}name="{{name}}"{{/if}} {{#if action}}onchange="{{action}}"{{/if}} class="form-control {{#if (eq convertToNumber true)}}scConvertNumber {{/if}}w-{{#if width}}{{width}}{{else}}10{{/if}}" {{#if placeholder}}placeholder="{{placeholder}}"{{/if}} type="{{type}}" {{#if value}}value="{{value}}"{{/if}}{{#if disabled}} disabled{{/if}}{{#if readonly}} readonly{{/if}}>{{#if fe_icon}}</div>{{/if}}{{/if}}'

								 + '{{#if (eq type "textarea")}}<textarea {{#if action}}onchange="{{action}}"{{/if}} class="form-control" {{#if id}}id="{{id}}"{{/if}} {{#if name}}name="{{name}}"{{/if}} {{#if placeholder}}placeholder="{{placeholder}}"{{/if}}>{{#if value}}{{value}}{{/if}}</textarea>{{/if}}'
								 
								 + '{{#if (eq type "button")}}<button type="{{#if (eq action "submit")}}submit{{else if (eq action "reset")}}reset{{else}}button{{/if}}" {{#if (and (ne action "submit") (ne action "reset"))}}onclick="{{action}}"{{/if}} class="btn btn-{{#if class}}{{class}}{{else}}primary{{/if}} {{#if (eq small true)}}btn-sm {{/if}}{{#if ml}}ml-{{ml}} {{/if}}{{#if (eq block true)}}btn-block {{/if}}" {{#if name}}name="{{name}}"{{/if}} {{#if id}}id="{{id}}"{{/if}}>{{#if fe_icon}}<i class="fe fe-{{fe_icon}}"></i>{{/if}}{{#if value}} {{value}}{{/if}}</button>{{/if}}'
								  
								 + '{{#if (eq type "select")}}<select class="form-control custom-select {{#if (eq convertToNumber true)}}scConvertNumber {{/if}}" {{#if name}}name="{{name}}"{{/if}} {{#if id}}id="{{id}}"{{/if}} {{#if action}}onchange="{{action}}"{{/if}}>{{#each options}}<option value="{{value}}" {{#if id}}id="{{id}}"{{/if}} {{#if (eq ../value value)}} selected{{/if}}>{{label}}</option>{{/each}}</select>{{/if}}'
								 
								 + '{{#if (eq type "select-buttons")}}<div class="selectgroup selectgroup-vertical w-100">{{#each options}}<label class="selectgroup-item"><input type="radio" name="{{../name}}" value="{{value}}" class="selectgroup-input {{#if (eq convertToNumber true)}}scConvertNumber {{/if}}" {{#if id}}id="{{id}}"{{/if}} {{#if (eq ../selected value)}} checked=""{{/if}}{{#if (eq ../value value)}} checked=""{{/if}}{{#if (eq disabled true)}} disabled{{/if}}><span class="selectgroup-button">{{label}}</span></label>{{/each}}</div>{{/if}}'
								 
								 + '{{#if (eq type "switch-group")}}<div class="custom-switches-stacked">{{#each options}}<label class="custom-switch"><input type="radio" class="custom-switch-input {{#if (eq convertToNumber true)}}scConvertNumber {{/if}}" name="{{../name}}" value="{{value}}"  {{#if (eq ../selected value)}} checked=""{{/if}}{{#if (eq ../value value)}} checked=""{{/if}}{{#if disabled}} disabled{{/if}}><span class="custom-switch-indicator"></span><span class="custom-switch-description">{{label}}</span></label>{{/each}}</div>{{/if}}'
								 
								 + '{{#if (eq type "radio")}}<div class="custom-controls-stacked">{{#each options}}<label class="custom-control custom-radio"><input type="radio" class="custom-control-input {{#if (eq convertToNumber true)}}scConvertNumber {{/if}} {{#if (eq ../convertToNumber true)}}scConvertNumber{{/if}}" name="{{../name}}" value="{{value}}" {{#if (eq ../selected value)}} checked=""{{/if}}{{#if (eq ../value value)}} checked=""{{/if}}{{#if disabled}} disabled{{/if}}><div class="custom-control-label">{{label}}</div></label>{{/each}}</div>{{/if}}'
								 
								 + '{{#if (eq type "hidden")}}<input type="hidden" name="{{name}}" value="{{value}}" class="{{#if (eq convertToNumber true)}}scConvertNumber{{/if}}" />{{/if}}'
								 
								 + '{{#if (eq type "static")}}<div class="form-control-plaintext">{{value}}</div>{{/if}}'
								 
								 + '{{#if (eq type "range")}}<input type="range" class="form-control custom-range {{#if (eq convertToNumber true)}}scConvertNumber {{/if}}" step="{{step}}" min="{{min}}" max="{{max}}" {{#if value}} value="{{value}}"{{/if}}  name="{{name}}">{{/if}}'
								 
								 + '{{#if (eq type "checkbox")}}<label class="custom-switch"><input type="checkbox" name="{{name}}" class="custom-switch-input {{#if (eq convertToNumber true)}}scConvertNumber {{/if}}" {{#if (eq checked true)}} checked{{/if}}{{#if (eq value true)}} checked{{/if}}><span class="custom-switch-indicator"></span><span class="custom-switch-description">{{label}}</span></label>{{/if}}'
								 
								 + '{{#if (eq type "file")}}<div class="custom-file"><input type="file" class="custom-file-input" id="{{id}}" name="{{name}}" {{#if accept}}accept="{{accept}}"{{/if}} onchange="spacecore.fileOnChangeHelper({{id}});"><label class="custom-file-label" id="{{id}}-label">{{default}}</label></div>{{/if}}'
								 
								 + '{{#if (eq type "selectgroup")}}<div class="selectgroup selectgroup-pills selectgroup-separated">{{#each options}}<label class="selectgroup-item"><input type="checkbox" name="{{../name}}" value="{{value}}" class="selectgroup-input {{#if (eq ../convertToNumber true)}}scConvertNumber {{/if}}" {{#if (isin ../value value)}} checked{{/if}}><span class="selectgroup-button">{{label}}</span></label>{{/each}}</div>{{/if}}'
								 
								 + '{{#if (eq type "pricegroup")}}<table class="table table-hover table-outline table-vcenter text-nowrap card-table"><tbody>{{#each items}}<tr>'
								 + '<td class="w-1"><label class="custom-switch"><input type="checkbox" id="pricegroup-{{../name}}-enabled-{{id}}" class="custom-switch-input" onclick="spacecore.ui.pricegroupUpdate(\'{{../name}}\', {{id}});" {{#if (eq enabled true)}} checked{{/if}}><span class="custom-switch-indicator"></span></label></td>'
								 + '<td>{{label}}</td>'
								 + '<td><div class="input-group"><div class="input-group-prepend"><span class="input-group-text">{{../prefix}}</span></div><input id="pricegroup-{{../name}}-value-{{id}}" class="form-control {{../textclass}}" placeholder="{{../placeholder}}" type="text" value="{{value}}" onclick="spacecore.ui.pricegroupUpdate(\'{{../name}}\', {{id}});" onchange="spacecore.ui.pricegroupUpdate(\'{{../name}}\', {{id}});" oninput="spacecore.ui.pricegroupUpdate(\'{{../name}}\', {{id}});" {{#if (eq enabled false)}} disabled{{/if}}></div></td>'
								 + '</tr>{{/each}}</tbody></table>{{/if}}'
								 
		);
				
		Handlebars.registerPartial('dashboardHeader', '<div class="header py-4"><div class="container"><div class="d-flex">'
													+ '<span class="header-brand"><img src="./assets/spacecore-header.svg" class="header-brand-img" alt="Spacecore"></span>'
													+ '<div class="d-flex order-lg-2 ml-auto">'
													+ '{{#each user}}{{>headerUser}}{{/each}}'
													+ '</div>'
													+ '<a href="#" class="header-toggler d-lg-none ml-3 ml-lg-0" data-toggle="collapse" data-target="#headerMenuCollapse"><span class="header-toggler-icon"></span></a>'
													+ '</div></div></div>');
		
		Handlebars.registerPartial('dropdownMenuElement', '{{#if (eq divider true)}}<div class="dropdown-divider"></div>{{else}}<a href="{{action}}" class="dropdown-item">{{#if fe_icon}}<i class="dropdown-icon fe fe-{{fe_icon}}"></i> {{/if}}{{label}}</a>{{/if}}');
		
		Handlebars.registerPartial('dashboardMenu', '<div class="header collapse d-lg-flex p-0" id="headerMenuCollapse"><div class="container"><div class="row align-items-center"><div class="col-lg order-lg-first">'
												  + '<ul class="nav nav-tabs border-0 flex-column flex-lg-row">{{#each menu}}{{>headerMenuElement}}{{/each}}</ul>'
												  + '</div></div></div></div>');
		
		Handlebars.registerPartial('headerMenuElement', '<li class="nav-item"><a href="{{action}}" class="nav-link">{{#if fe_icon}}<i class="fe fe-{{fe_icon}}"></i> {{/if}}{{label}}</a></li>');
		
		Handlebars.registerPartial('avatar', '<span class="avatar d-block" style="background-image: url({{decodeAvatar avatar}})"></span>');
		
		Handlebars.registerPartial('headerUser', '<div class="dropdown"><a href="#" class="nav-link pr-0 leading-none" data-toggle="dropdown">'
											   + '{{>avatar}}'
											   + '<span class="ml-2 d-none d-lg-block">'
											   + '<span class="text-default">{{name}}</span>'
											   + '<small class="text-muted d-block mt-1">{{sub}}</small></span>'
											   + '</a><div class="dropdown-menu dropdown-menu-right dropdown-menu-arrow">{{#each menu}}{{>dropdownMenuElement}}{{/each}}</div></div>');
				
		Handlebars.registerPartial('dashboardFooter', '<footer class="footer"><div class="container"><div class="row align-items-center flex-row-reverse">'
													+ '<div class="col-12 col-lg-0 mt-lg-0 text-center">'+this._opts.copyrightString+'</div>'
													+ '</div></div></footer>');
		
		Handlebars.registerPartial('dropdown', '<div class="item-action dropdown"><a href="javascript:void(0)" data-toggle="dropdown" class="icon"><i class="fe fe-more-vertical"></i></a><div class="dropdown-menu dropdown-menu-right">{{#each this}}{{>dropdownMenuElement}}{{/each}}</div></div>');
		
		Handlebars.registerPartial('tableRow', '<{{#if (eq header true)}}th{{else}}td{{/if}} {{#if action}}onclick="{{action}}"{{/if}} {{#if width_old}}width="{{width_old}}"{{/if}} class="{{#if (eq text_center true)}}text-center {{/if}}{{#if width}}w-{{width}}{{/if}}{{#if action}} cursor-pointer{{/if}}">{{#if (isset avatar)}}{{>avatar}}{{/if}}{{#if fe_icon}}<i class="fe fe-{{fe_icon}}"></i>{{/if}}{{#if (isset menu)}}{{>dropdown menu}}{{/if}}{{#if elements}}{{#each elements}}{{>formElement}}{{/each}}{{/if}}{{#if text}}{{replaceNewlines text}}{{/if}}{{#if fe_icon_after}}<i class="fe fe-{{fe_icon_after}}"></i>{{/if}}</{{#if (eq header true)}}th{{else}}td{{/if}}>');
		
		Handlebars.registerPartial('table', '<div {{#if id}}id="{{id}}"{{/if}} class="table-responsive"><table {{#if id}}id="{{id}}_table"{{/if}} class="table table-hover table-outline table-vcenter text-nowrap card-table tablesorter">'
										  + '<thead><tr>'
										  + '{{#each header}}{{#if (string this)}}<th>{{this}}</th>{{else}}{{>tableRow header=true}}{{/if}}{{/each}}'
										  + '</tr></thead>'
										  + '<tbody>'
										  + '{{#each body}}{{#if (list this)}}<tr>{{#each this}}{{#if (string this)}}<td>{{this}}</td>{{else}}{{>tableRow}}{{/if}}{{/each}}</tr>{{else}}<tr {{#if id}}id="{{id}}"{{/if}}>{{#each fields}}{{#if (string this)}}<td>{{this}}</td>{{else}}{{>tableRow}}{{/if}}{{/each}}</tr>{{/if}}{{/each}}'
										  + '</tbody>'
										  + '</table></div>');
		
		Handlebars.registerPartial('media', '<span class="avatar avatar-xxl mr-5" style="background-image: url({{decodeAvatar avatar}})"></span>'
										  + '<div class="media-body">'
										  + '<h4 class="m-0">{{name}}</h4>'
										  + '<p class="text-muted mb-0">{{comment}}</p>'
										  + '<ul class="social-links list-inline mb-0 mt-2">{{buttons}}</ul>'
										  + '</div>');
				
		Handlebars.registerPartial('card', '{{#if id}}<div id="{{id}}">{{/if}}{{#if form}}<form class="card" {{#if form.action}}action="{{form.action}}"{{/if}}{{#if form.id}}id="{{form.id}}"{{/if}}>{{else}}<div class="card">{{/if}}'
										 + '{{#if header}}<div class="card-header">{{#if header.title}}<div class="card-title">{{header.title}}</div>{{/if}}{{#if header.options}}<div class="card-options">{{#each header.options}}{{>formElement}}{{/each}}</div>{{/if}}</div>{{/if}}'
										  + '{{#if table}}{{>table table}}{{else}}'
										 + '<div class="card-body p-{{#if (isset padding)}}{{padding}}{{else}}6{{/if}}">'
										 + '{{#if title}}<div class="card-title">{{title}}</div>{{/if}}'
										 + '{{#if media}}<div class="media">{{>media media}}</div>{{/if}}'
										 + '{{#if lines}}<div class="form-group">{{#each lines}}{{this}}{{/each}}</div>{{/if}}'
										 + '{{#if raw}}<div class="form-group">{{{raw}}}</div>{{/if}}'
										 + '{{#if form}}<div class="form-group">{{#each form.elements}}{{>formElement}}{{#if (eq ng true)}}</div><div class="form-group">{{/if}}{{/each}}</div>{{/if}}'
										 + '{{#if (or (or footer form.footer) (or error buttons))}}<div class="form-footer"><div class="d-flex">{{#each form.footer}}{{>formElement}}{{/each}}{{#each buttons}}{{>formElement}}{{/each}}{{footer}}</div>{{#if error}}<span class="small text-danger">{{error}}</span>{{/if}}</div>{{/if}}'
										 + '</div>{{/if}}{{#if form}}</form>{{else}}</div>{{/if}}{{#if id}}</div>{{/if}}');
		
		Handlebars.registerPartial('pageHeader', '<div class="page-header"><h1 class="page-title">{{title}}</h1><div class="page-subtitle">{{subtitle}}</div><div class="page-options d-flex">{{#each options}}<div class="ml-2">{{>formElement}}</div>{{/each}}</div></div>');
				
		Handlebars.registerPartial('bodyElement', '{{#if (eq type "alert")}}<div class="alert alert-{{#if class}}{{class}}{{else}}primary{{/if}}" role="alert">{{value}}</div>{{/if}}'
												+ '{{#if (eq type "table")}}{{>table}}{{/if}}'
												+ '{{#if (eq type "card")}}{{>card}}{{/if}}'
												+ '{{#if (eq type "raw")}}{{{raw}}}{{/if}}'
												+ '{{#if (eq type "loadingcircle")}}<div class="loadingcircle">&nbsp;</div>{{/if}}');
		
		Handlebars.registerPartial('pageColumn', '<div class="{{#if (eq center true)}}text-center{{/if}}{{#if (list width)}}{{#each width}}col-{{this}} {{/each}}{{else}}col-{{#if width}}{{width}}{{else}}12{{/if}}{{/if}}">'
											 + '{{#if (list this)}}{{#each this}}{{>bodyElement}}{{/each}}{{else}}{{#if elements}}{{#each elements}}{{>bodyElement}}{{/each}}{{else}}{{>bodyElement}}{{/if}}{{/if}}'
											 + '</div>');
		
		//console.log("[UI] Registering templates...");
		
		this.templates['single'] = Handlebars.compile('<div class="page-single"><div class="container"><div class="row">'
													+ '<div class="col col-login mx-auto"><div class="text-center mb-6">'
													+ '<img src="./assets/spacecore.svg" class="h-9" alt=""></div>'
													+ '{{>card}}'
													+ '<div class="text-center text-muted">{{#if muted}}{{muted}}{{else}}'+this._opts.copyrightString+'{{/if}}</div>'
													+ '</div></div></div></div>');
		
		this.templates['dashboard'] = Handlebars.compile('<div class="page-main">{{>dashboardHeader}}{{>dashboardMenu}}<div class="my-3 my-md-5"><div class="container">'
													   + '{{#if content}}'
													   + '{{#if content.header}}{{>pageHeader content.header}}{{/if}}'
													   + '{{#each content.body}}<div class="row">{{#each this}}{{>pageColumn}}{{/each}}</div>{{/each}}'
													   + '{{else}}{{{raw}}}{{/if}}'
													   + '</div></div></div>{{>dashboardFooter}}');
		
		this.templates['table'] = Handlebars.compile("{{>table}}");
	}
	
	_decodeAvatar(input, fallback="./assets/spacecore-globe.svg") {
		if (typeof input === 'string') return input;
		if (typeof input !== 'object') return fallback;
		if (input === null) return fallback;
		if (typeof input.mime !== 'string') return fallback;
		if (typeof input.data !== 'string') return fallback;	
		return "data:"+input.mime+";base64,"+input.data;
	}
		
	show(html, elem="spacecore") {
		document.getElementById(elem).innerHTML = html;
		
		$('.loadingcircle').circleProgress({
			value: 1,
			size: 80,
			fill: {
			gradient: ["#CB5348", "#FF7046"]
			}
		});
	}
	
	showTemplate(template='single', data={}, sortableTables=[], elem="spacecore") {
		if (typeof this.templates[template] === 'undefined') return false;
		this.show(this.templates[template](data), elem);
		this.enableSorting(sortableTables);
		return true;
	}
	
	enableSorting(sortableTables) {
		for (var i in sortableTables) {
			$("#"+sortableTables[i]+"_table").tablesorter();
		}
	}
	
	renderTemplate(template='single', data={}) {
		if (typeof this.templates[template] === 'undefined') return null;
		return this.templates[template](data);
	}
	
	elemBtnSecondary(actionString, caption="Cancel", id="", icon="x", value="") {
		return {
			type: "button",
			action: actionString,
			fe_icon: icon,
			value: caption,
			class: "secondary",
			id: id
		}
	}
	
	elemBtnPrimary(actionString, caption="Save", id="", icon="save", value="") {
		return {
			type: "button",
			action: actionString,
			fe_icon: icon,
			value: caption,
			ml: "auto",
			id: id
		}
	}
	
	elemSearchBox(actionString, caption="Search...", id="searchBox", icon="search", value="") {
		return {
			type:"text",
			id: id,
			fe_icon: icon,
			placeholder: caption,
			action:  actionString,
			value: value
		}
	}
	
	pricegroupUpdate(name, id) {
		var elem_enabled  = document.getElementById("pricegroup-"+name+"-enabled-"+id);
		var elem_value    = document.getElementById("pricegroup-"+name+"-value-"+id);
		var enabled       = elem_enabled.checked;
		var value         = elem_value.value;
		
		elem_value.disabled = !enabled;
		
		var invalid       = false;
		
		if (enabled) {
			invalid = isNaN(value);
		}
		
		if (invalid) {
			elem_value.classList.add("is-invalid");
		} else {
			elem_value.classList.remove("is-invalid");
		}
		
		console.log("pricegroupUpdate result", name, id, enabled, value, invalid);
	}
}


