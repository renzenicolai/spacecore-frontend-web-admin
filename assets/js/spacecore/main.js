class Spacecore {
	constructor( opts ) {
		this._opts = Object.assign({
			apiUrl: window.location.protocol.replace("http","ws")+"//"+window.location.host+"/api/"
		}, opts);
		
		this.ui = new SpacecoreUI({
			//...
		});
		
		this.modules = [
			new Dashboard({ //The first module is shown by default after login
				ui: this.ui,
				app: this
			}),
			new Persons(),
			new Products({
				ui: this.ui,
				app: this
			}),
			new Files({
				ui: this.ui,
				app: this
			}),
            new Reports({
				ui: this.ui,
				app: this
			}),
			new Login({ //Always leave the login module as the last module
				ui: this.ui,
				app: this
			})
		];
		
		this._wsCallbacks = {};
		this._wsPushCallbacks = {};
		
		this.sessionId = null;
		this.state = null;

		this.currentModule = null;
		this.homeModule = this.modules[0];
		
		this.refreshActive = false;
		
		this.history = [];
		
		this.showMessage("Connecting to the server...", "Welcome");
		this.connected = false;
		this.connect();
		this.lastPong = new Date();
		this.pingTicker = setInterval(this.executePing.bind(this), 5000);
	}
	
	/* Helper functions for data */
	
	generateUid() {
		return (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
	}
	
	setCurrentModule(name) {
		this.currentModule = findModule(name);
	}
	
	findModule(name, returnObject = false) {
		for (var i in this.modules) {
			if (this.modules[i].name === name) {
				if (returnObject) return this.modules[i];
				return i;
			}
		}
		return null;
	}
	
	checkPermission(method) {
		if (this.state === null) return false;
		if (this.state.user === null) return false;
		for (var i in this.state.user.permissions) {
			if (method.startsWith(this.state.user.permissions[i])) return true;
		}
	}
	
	/* Helper functions for templates */
	
	showMessage(msg, title="",buttons=[]) {
		if (typeof msg === "string") msg = [msg];
		var data = {lines: msg};
		if (title.length>0) data['title'] = title;
		if (buttons.length>0) data['buttons'] = buttons;
		this.ui.showTemplate('single', data);
	}
	
	showMessage2(msg, moduleTitle="", title="",buttons=[]) {
		if (typeof msg === "object") {
			var elems = msg;
			msg = "";
			for (var i in elems) {
				msg += elems[i]+"<br />";
			}
		}
		this.showPage({
			header: {
				title: moduleTitle,
				options: []
			},
			body: [
				[
					[
						{
							type: "card",
							width: ['lg-8', 'md-12'],
							header: {
								title: title
							},
							raw: msg,
							form: {
								id: "message-form",
								elements: [],
								footer: buttons
							}
						}
					]
				]
			]
		});
	}
	
	showLoadingCircle(title) {
		this.showPage({header: { title: title }, body: [[[{ type: "loadingcircle", width: ['lg-8', 'md-12'], center: true}]]]});
	}
	
	/* Helper functions for menu */
		
	generateMenu(name) {	
		var menu = [];
		for (var i in this.modules) {
			menu = menu.concat(this.modules[i].menu(name));
		}
		return menu;		
	}
	
	generateUser() {
		var name = "Anonymous user";
		var title = "Guest";
		var avatar = null;
		if (this.state !== null) {
			if (typeof this.state.user.full_name === 'string') name = this.state.user.full_name;
			if (typeof this.state.user.title === 'string') title = this.state.user.title;
			if ((title === "") && (typeof this.state.user.user_name === 'string')) title = this.state.user.user_name;
			if (typeof this.state.user.avatar === 'object') avatar = this.state.user.avatar;
		} else {
			console.log("Tried to generate user info without state, returning defaults.");
		}
		return [{
			"name": name,
			"sub": title,
			"avatar": avatar,
			"menu": this.generateMenu("user")
		}];
	}
		
	/* Websocket */
	
	connect() {
		this.ws = new WebSocket(this._opts.apiUrl);
		this.ws.onmessage = this.handleResponse.bind(this);
		this.ws.onerror = this.handleError.bind(this);
		this.ws.onclose = this.handleClose.bind(this);
		this.ws.onopen = this.handleOpen.bind(this);
	}
	
	handleOpen(event) {
		if (this.sessionId === null) {
			this.showMessage(["Connected to server.","Starting session..."], "Please wait...");
			this.executeCommand('session/create', null, this.handleSession);
		} else {
			this.showMessage("Connection has been reestablished.", "Please wait...");
			console.log("!!! Open refresh");
			this.executeRefresh();
		}
		this.connected = true;
	}
	
	handleError(event) {
		console.log("[ERROR]", event);
		this.showMessage("Something went wrong and the application needs to restart.","An error occured!");
	}
	
	handleClose() {
		this.showMessage("The application will start as soon as a connection with the server has been made.", "Server unavailable");
		this.connected = false;
		setTimeout(this.connect.bind(this), 2000);
 	}
 	
 	/* Navigation */
	handleBackButton() {
		var action = this.history.pop();
		console.log("Back action", action);
		if (typeof action === 'function') action();
	}
	
	jumpToTop() {
		$('html,body').scrollTop(0);
	}
	
	/* Protocol */
	
	executeCommand(method='ping', params=[], callback=null) {
		var uid = this.generateUid();
		var message = JSON.stringify({
			jsonrpc: "2.0",
			id: uid,
			method: method,
			params: params,
			token: this.sessionId
		});
		if (typeof callback === 'function') {
			this._wsCallbacks[uid] = callback.bind(this);
		}		
		this.ws.send(message);
		return true;
	}
	
	/* Commands and handling */
	
	executePing() {
		if (this.connected) {
			var now = new Date();
			var timeSinceLastPong = now.getTime() - this.lastPong.getTime();
			//console.log("timeSinceLastPong", timeSinceLastPong);
			if (timeSinceLastPong > 10000) {
				//console.log("!!! Timeout refresh");
				//this.executeRefresh();
				console.log("!!! SHOULD PROBABLY REFRESH [TIMEOUT] !!!");
			}
			this.executeCommand('ping', null, this.handlePing);
		}
	}
	
	handlePing() {
		this.lastPong = new Date();
	}
	
	executeRefresh(showMessage=true) {
		if (!this.refreshActive) {
			this.refreshActive = true;
			setTimeout(this.handleRefreshTimeout.bind(this), 5000);
			if (showMessage) this.showMessage("Loading...");
			if (this.sessionId !== null) {
				this.executeCommand('session/state', null, this.handleRefresh);
			} else {
				this.showMessage(["You've triggered a bug in the spacecore frontend. Please contact the developer."]);
				console.log("executeRefresh without session exception!");
			}
		} else {
			console.log("(skip refresh, busy)");
		}
	}
	
	reset() {
		this.sessionId = null;
		this.state = null;
		this._wsCallbacks = {};
		this._wsPushCallbacks = {};
		this.executeCommand('session/create', null, this.handleSession);
	}
	
	handleRefresh(state, error) {
		this.refreshActive = false;
		if (error !== null) {
			console.log("Could not refresh, resetting...", error);
			if (error.message === "Access denied") {
				this.showMessage(
					["The system could not fetch the state of your session.",
					 "",
					 "",
					 "This most likely means that your session has been terminated. Press the restart application button to return to the login screen."
					],
					"An error occured!",
					[
						{
							type: "button",
							value:"Restart application",
							action: "javascript:spacecore.reset()"
						}
					]
				);
			} else {
				this.showMessage(["Session terminated.",error.message]);
			}
			//setTimeout(this.reset.bind(this), 5000);
			return;
		}
		
		this.state = state;
		//console.log("State reloaded. New state: ",state);
		this.action();
	}
		
	handleRefreshTimeout() {
		if (this.refreshActive) {
			alert("Timeout in refresh!");
			console.log("REFRESH TIMEOUT");
			this.refreshActive = false;
			this.reset();
		}
	}
	
	
	handleSession(sessionId, error=null) {
		if (error !== null) {
			if ((typeof error === "object") && (typeof error.message === "string")) {
				this.showMessage(["Can not start session!","Error: "+error.message]);
			} else {
				this.showMessage("Error: can not start session.");
			}
			console.log("handleSession error", error);
			return;
		}
		this.sessionId = sessionId;
		this.action("login");
	}
	
	
	decodeAvatar(input) {
		var avatar = "./assets/spacecore-globe.svg";
		if (typeof input === 'undefined') return avatar;
		if (input === null) return avatar;
		avatar = "data:"+input.mime+";base64,"+input.data;
		return avatar;
	}
		

	filter(data, query, fields, caseSensitive=false) {
		//console.log("Filter",data,"-",query,"-",fields);
		query = query.split(' ');
		
		var output = [];
				
		for (var i in data) {
			var match = false;
			matched:
			for (var j in query) {
				for (var k in fields) {
					//console.log("Matching ",query[j], fields[k]);
					if (typeof data[i][fields[k]] === 'undefined') {
							console.log("Invalid field", k, fields[k]);
					} else {
						var q = data[i][fields[k]];
						if (typeof q === 'number') q = q.toString();
						if (!caseSensitive) {
							if (q.toLowerCase().lastIndexOf(query[j].toLowerCase()) > -1) {
								match = true;
								break matched;
							}
						} else {
							if (q.lastIndexOf(query[j]) > -1) {
								match = true;
								break matched;
							}
						}
					}
				}
			}
			if (match) output.push(data[i]);
		}
		return output;		
	}
	
	sort(data, field=null, reverse=false) {
		if (field===null) return data;
		
		var kw = [];
		
		for (var i in data) {
			if (!kw.includes(data[i][field])) kw.push(data[i][field]);
		}
		
		kw.sort();
		if (reverse) kw.reverse();
		
		var output = [];
		
		for (var i in kw) {
			for (var j in data) {
				if (data[j][field] === kw[i]) output.push(data[j]);
			}
		}
		
		return output;
	}
	
	showMain(content, sortableTables=[]) {
		this.ui.showTemplate("dashboard", {
			menu: this.generateMenu("main"),
			user: this.generateUser(),
			raw: content
		}, sortableTables);
	}
	
	showPage(content, sortableTables=[]) {
		this.ui.showTemplate("dashboard", {
			menu: this.generateMenu("main"),
			user: this.generateUser(),
			content: content
		}, sortableTables);
	}
	
	action(module=null, part=null, reset=false) {
		if (module === null) { //Show got called without argument, show current module
			module = this.currentModule;
		}
		if (typeof module === "string") { //Show got called with the name of a module, try to resolve
			module = this.findModule(module, true);
		}
		if ((typeof module === "object") && (typeof module.show === "function")) { //By now we should have the module to be shown as an object. Call the show function of the module.
			this.currentModule = module;
			if (typeof part === 'string') {
				return module.show(reset, part);
			} else {
				return module.show(reset);
			}
		}
		console.log("Error: can not show module", module);
	}
	
	pushSubscribe(subject, callback) {
		if (!(subject in this._wsPushCallbacks)) {
			//Need to subscribe
			this.executeCommand('session/push/subscribe', subject);
			console.log("Subscribed to pushmessages with topic "+subject);
		} else {
			console.log("Already subscribed to pushmessages with topic "+subject);
		}
		this._wsPushCallbacks[subject] = callback;
	}
	
	handleResponse(event) {
		try {
			var message = JSON.parse(event.data);
			if (typeof message === 'string') {
				message = {
					result: null,
					err: message
				};
			} else {
				if (typeof message.result === 'undefined') message.result = null;
				if (typeof message.error === 'undefined') message.error = null;
			}
			if ((typeof message.pushMessage === 'boolean') && (message.pushMessage)) {
				if (message.subject in this._wsPushCallbacks) {
					console.log("Executing callback for pushmessage with topic",message.subject);
					this._wsPushCallbacks[message.subject](message.message);
				} else {
					console.log("[PUSH] "+message.subject+": ", message.message);
				} 
			} else {
				if (typeof message.id !== 'undefined') {
					if (typeof this._wsCallbacks[message.id]==='function') {
						this._wsCallbacks[message.id](message.result, message.error);
						delete this._wsCallbacks[message.id];
					} else {
						console.log(message);
					}
				} else {
					console.log("<NO ID>", message);
				}
			}
		} catch(err) {
			console.log("An error occured while handling an event response!",err);
			this.handleError(err);
		}
	}
	
	submitFormFileHandler(method, argument, handler, fileReaders) {
		console.log("Waiting for filereaders...", "method",method, "argument",argument, "handler",handler, "filereaders",fileReaders);
		var busy = false;
		checkLoop:
		for (var i = 0; i < fileReaders.length; i++) {
			var elem = fileReaders[i];
			console.log("Readers for "+elem.name+": "+elem.data.length);
			for (var j = 0; j < elem.data.length; j++) {
				var data = elem.data[j];
				var state = data.reader.readyState;
				console.log(" "+data.id+"] "+state);
				if (state === 1) {
					busy = true;
					break checkLoop;
				}
			}
		}
		//console.log("Busy", busy);
		if (busy) {
			setTimeout(this.submitFormFileHandler.bind(this, method, argument, handler, fileReaders), 100);
		} else {
			for (var i = 0; i < fileReaders.length; i++) {
				var elem = fileReaders[i];
				var name = elem.name;
				var files = [];
				for (var j = 0; j < elem.data.length; j++) {
					var data = elem.data[j];
					files.push({
						name: data.file.name,
						mime: data.file.type,
						size: data.file.size,
						data: data.reader.result.split(',')[1]
					});
				}
				argument[name] = files;
			}
			this.showMessage2("Processing...", "", "Busy");
			//console.log("Submit form with files ",method,argument);
			this.executeCommand(method, argument, handler);
		}
	}
	
	submitForm(handler, formName, method, showStatusMessage=true) {
		var form = document.getElementById(formName);
		if (form === null) {
			console.log("submitForm: form",formName,"does not exist.");
		}
		var formElements = form.elements;
		var argument = {};
		var firstCheckboxValueTemp = null;
		var fileReaders = [];
		var priceGroups = {};
		for (var i in formElements) {
			if (i === 'length') continue;
			var name  = formElements[i].name;
			var value = formElements[i].value;
			var type  = formElements[i].type;
			var id    = formElements[i].id;
			if ((typeof name === "string") && name.startsWith("commaseparated-")) {
				argument[name.split("-")[1]] = value.split(",");
			} else if ((typeof id === "string") && (id.startsWith("pricegroup-"))) {
				var name  = id.split("-")[1];
				var group = Number(id.split("-")[3]);
				if (!(name in priceGroups)) {
					priceGroups[name] = {};
				}
				if (!(group in priceGroups[name])) {
					priceGroups[name][group] = {enabled: false, value: null};
				}
				if (type === "checkbox") {
					priceGroups[name][group].enabled = formElements[i].checked;
				}
				if (type === "text") {
					priceGroups[name][group].value = Math.round(Number(formElements[i].value)*100);
				}
			} else if (typeof name === "string") {
				if (type=="radio") {
						if (formElements[i].checked) {
							if (formElements[i].classList.contains("scConvertNumber")) {
							console.log("scConvertNumber", value, typeof value);
							if (value === "") {
								value = null;
							} else {
								value = Number(value);
							}
						}
						argument[name] = value;
						//console.log("Handled RADIO element", name, value);
					}
				} else if (type=="checkbox") {
					var value = null;
					if (formElements[i].value !== "undefined") value = formElements[i].value;
					if (formElements[i].classList.contains("scConvertNumber")) {
						console.log("scConvertNumber", value, typeof value);
						if (value === "") {
							value = null;
						} else {
							value = Number(value);
						}
					}
					
					if (typeof argument[name] === "undefined") {
						//First checkbox with this name
						argument[name] = formElements[i].checked;
						firstCheckboxValueTemp = value;
						//console.log("First checkbox with name",name,": argument is now a boolean", argument[name]);
					} else if (typeof argument[name] === "boolean") {
						var firstCheckboxStateTemp = argument[name];
						argument[name] = [];
						if (firstCheckboxStateTemp) argument[name].push(firstCheckboxValueTemp);
						if (formElements[i].checked) argument[name].push(value);
						//console.log("Second checkbox with name",name,": argument has been changed from boolean to list", argument[name]);
					} else if (formElements[i].checked) {
						argument[name].push(value);
						console.log("Extra checkbox with name",name,": argument is list", argument[name]);
					}
					//console.log("Handled CHECKBOX element", name, argument[name]);
				} else if (type=="file") {
					argument[name] = "...";
					var files = formElements[i].files;
					//console.log("Handled FILE element", name, files);
					var data = [];
					for (var j = 0; j < files.length; j++) {
						var f = files[j];
						//console.log("File "+j+": "+f.name+" ("+f.type+") with size "+f.size);
						var reader = new FileReader();
						reader.readAsDataURL(f);
						data.push({id: j, file: f, reader: reader});
					}
					fileReaders.push({name: name, data: data});
				} else if ((typeof value === "string") && (name.length > 0)) {
					if (formElements[i].classList.contains("scConvertNumber")) {
						//console.log("scConvertNumber", value, typeof value);
						if (value === "") {
							value = null;
						} else {
							value = Number(value);
						}
					}
					argument[name] = value;
					//console.log("Handled GENERIC element", name, value);
				}
			} else {
				console.log("Unhandled element", formElements[i]);
			}
		}
		
		for (var name in priceGroups) {
			var priceGroup = priceGroups[name];
			if (!(name in argument)) {
				argument[name] = {};
			}
			for (var group in priceGroup) {
				var priceGroupItem = priceGroup[group];
				if (priceGroupItem.enabled) {
					argument[name][group] = priceGroupItem.value;
				}
			}
			console.log("PGR", argument[name]);
		}
		
		if (fileReaders.length > 0) {
			if (showStatusMessage) this.showMessage2("Preparing files for upload...", "", "Busy");
			this.submitFormFileHandler(method, argument, handler, fileReaders);
		} else {
			if (showStatusMessage) this.showMessage2("Processing...", "", "Busy");
			//console.log("Submit form ",method,argument);
			this.executeCommand(method, argument, handler);
		}
	}
	
	fileOnChangeHelper(id=null) {
		if (id === null) return;
		console.log("fileOnChangeHelper called for",id);
		var elem = null;
		if (typeof id==="object") {
			elem = id;
			id = elem.id;
		} else {
			elem = document.getElementById(id);
			if (elem === null) return console.log("fileOnChangeHelper couldn't find element",id);
		}
		var label = document.getElementById(id+"-label");
		if (label === null) return console.log("fileOnChangeHelper couldn't find label for element",id);
		
		label.innerText = "";
		if (elem.files.length > 0) label.innerText = elem.files[0].name;
	}
	
	/* Search */
	
	_updateTable(id, content) {
		document.getElementById(id).innerHTML = this.ui.renderTemplate('table', content);
		this.ui.enableSorting([id]);
	}
	
	search(dataType) {
		this.currentModule.state[dataType].searchText = document.getElementById(this.currentModule.state[dataType].searchId).value;
		var filtered = spacecore.filter(this.currentModule.state[dataType].lastData, this.currentModule.state[dataType].searchText, this.currentModule.state[dataType].filterFields, false);
		this._updateTable(this.currentModule.state[dataType].tableId, this.currentModule.state[dataType].render(filtered));
	}
}
