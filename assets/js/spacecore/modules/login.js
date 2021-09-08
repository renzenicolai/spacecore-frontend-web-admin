class Login {
	constructor( opts ) {
		this.name = 'login';
		
		opts = Object.assign({
			ui: null,
			app: null
		}, opts);
		
		this.ui = opts.ui;
		this.app = opts.app;
		
		this.reset();
	}
	
	reset() {
		this.state = {};
	}
	
	/* Menu */
	
	menu(menu='main') {
		var items = [];
		
		if (menu === "user") {
			items.push({divider: true});
			if (this.app.checkPermission('session/destroy')) items.push({
				label: "Logout",
				fe_icon: "log-out",
				action: "javascript:spacecore.action('"+this.name+"', 'logout');"
			});
		}
		return items;
	}
	
	/* Module */
	
	show(reset=true, part="login") {
		if (reset) this.reset();
		this.app.currentModule = this;
		//Module parts
		if (part==="login") return this._login();
		if (part==="logout") return this._logout();
		console.log("Unhandled part in login module",part);
	}
	
	/* Internal functions */
	
	_login(error="") {
		this.ui.showTemplate('single', {
			"title": "Login to your account",
			"form": {
				"id": "login-form",
				"action": "javascript:spacecore.currentModule.handleLoginForm()",
				"elements": [
					{
						"type":"text",
						"name": "user_name",
						"fe_icon": "user",
						"label":"Username",
						"placeholder":"Username",
					   
						"ng": true
					},
					{
						"type":"password",
						"name": "password",
						"fe_icon": "lock",
						"label":"Password",
						"placeholder": "Password"
					}
				],
				"footer": [
					{
						"type":"button",
						"action": "submit",
						"value":"Sign in",
						"block": true
					}
				]
			},
			"error": error
		});
	}
		
	handleLoginForm() {
		var form = 'login-form';
		var method = 'user/authenticate';
		spacecore.submitForm(this._handleLogin.bind(this), form, method, false);
		this.app.showMessage("Authentication in progress...", "Please wait...");
	}
	
	_handleLogin(res, err) {
		if (err !== null) {
			if ((typeof err === "object") && (typeof err.message === "string")) {
				this._login(err.message);
			} else {
				this._login("Could not login, server returned error.");
				console.log("loginResultHandler could not parse error as string, error is",err);
			}
			return;
		}
		this.app.currentModule = this.app.homeModule;
		this.app.executeCommand('session/state', null, this.app.handleRefresh);
	}
	
	/* Logout */
	
	_logout() {
		this.app.currentModule = this;
		this.app.executeCommand('session/destroy',{}, this._handleLogout.bind(this));
		this.app.showMessage("Please wait...", "Logout");
	}
	
	_handleLogout(res,err) {
		if (err !== null) {
			if ((typeof err === "object") && (typeof err.message === "string")) {
				this.showMessage(err.message);
			} else {
				this.showMessage("Internal error");
			}
			console.log("handleLogout error",err);
			return;
		}
		console.log("User logged out. Resetting application...");
		this.app.reset();
	}
};
