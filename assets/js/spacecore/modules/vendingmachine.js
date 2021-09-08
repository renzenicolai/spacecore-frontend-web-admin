class Vendingmachine {
	constructor( opts ) {
		this.name = 'vendingmachine';
		
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
		
		if (menu === "main") {
			items.push({
				label: "Vendingmachine UI",
				fe_icon: "home",
				action: "javascript:spacecore.action('"+this.name+"');"
			});
		}
		return items;
	}
	
	/* Module */
	
	show(reset=true, part="welcome") {
		if (reset) this.reset();
		this.app.currentModule = this;
		
		if (part==="welcome") {
			showWelcome();
		} else {
			console.log("Unhandled part in vendingmachine module", part);
		}
	}
	
	/* UI: Welcome screen */
	
	showWelcome() {
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
