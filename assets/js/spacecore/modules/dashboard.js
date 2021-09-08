class Dashboard {
	constructor( opts ) {
		this.name = 'dashboard';
		
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
	
	menu(menu) {
		var items = [];
		
		if ((menu === "main") || (menu === "user")) {
			items.push({
				label: "Dashboard",
				fe_icon: "home",
				action: "javascript:spacecore.action('"+this.name+"');"
			});
		}
		return items;
	}
	
	/* Dashboard */
	
	show(reset=true) {
		if (reset) this.reset();
		this.app.currentModule = this;
		this.app.showPage({
			header: {
				title: "Dashboard"
			},
			body: [
				[
					[
						{
							type: "alert",
							value: "Welcome to Spacecore "+this.app.state.user.full_name+"!"
						}
					]
				]
			]
		});
	}
};
