class Mt940 {
	constructor( opts ) {
		this.name = 'mt940';
		
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
				label: "MT940",
				fe_icon: "home",
				action: "javascript:spacecore.action('"+this.name+"');"
			});
		}
		return items;
	}
	
	/* Form */
	
	show(reset=true) {
		if (reset) this.reset();
		this.app.currentModule = this;
		this.app.showPage({
			header: {
				title: "MT940 import tool"
			},
			body: [
				[
					[
						{
							type: "card",
							width: ['lg-8', 'md-12'],
							header: {
								title: "MT940"
							},
							form: {
								id: "mt940-form",
								elements: [
									{
										id: "mt940files",
										type: "file",
										name: "mt940",
										label: "MT940",
										default: "Select a MT940 file...",
										value: ""
									}
								],
								
								footer: [
										{
											type: "button",
											action: "javascript:spacecore.currentModule.showDetails();",
											fe_icon: "x",
											value: "Cancel",
											class: "secondary"
										},
										{
											type: "button",
											action: "javascript:spacecore.currentModule.submitForm('mt940-form','mt940/parse')",
											fe_icon: "save",
											value: "Upload",
											ml: "auto"
										}
									]
							}
						}
					]
				]
			]
		});
	}
	
	showResult(res) {
		if (res.length < 1) return console.log("No data.");
		if (res.length > 1) console.log("Warning: multiple file result, ignored extra files!!!");
		
		res = res[0];
		
		this.app.currentModule = this;
		var cards = [];
		
		var tableBodyCredit = [];
		var tableBodyDebet = [];
		
		for (var i in res) {
			var set = res[i];
			
			for (var j in set.transactions) {
				var transaction = set.transactions[j];
				var name = "";
				var iban = "";
				var remi = "";
				if ("NAME" in transaction.fields) name = transaction.fields.NAME;
				if ("IBAN" in transaction.fields) iban = transaction.fields.IBAN;
				if ("REMI" in transaction.fields) remi = transaction.fields.REMI;
				
				var amount    = "€ " + (transaction.statement.amount/100.0);
				var direction = transaction.statement.credit ? "Credit" : "Debet";
				var date      = transaction.statement.date;
				
				var description = name+"\n"+iban;
				
				if ((name === "") && (iban === "")) {
					description = "(Unknown)";
				}
				
				if ((remi === "") && (typeof transaction.info === 'object')) remi = transaction.info.join("\n");
				
				var row = [
					{
						text: direction
					},
					{
						text: amount
					},
					{
						text: date
					},
					{
						text: name //description
					},
					{
						text: iban
					},
					{
						text: remi
					}
				];
				
				//if (transaction.statement.credit) {
					tableBodyCredit.push(row);
				//} else {
				//	tableBodyDebet.push(row);
				//}
			}
		}
		
		var tableCredit = {
			id: "table",
			header: [
				{
					text: "Direction"
				},
				{
					text: "Amount"
				},
				{
					text: "Date"
				},
				{
					text: "Name"// & IBAN"
				},
				{
					text: "IBAN"
				},
				{
					text: "Description"
				}
			],
			body: tableBodyCredit
		};
		
		var tableDebet = {
			id: "table",
			header: [
				{
					text: "Amount"
				},
				{
					text: "Date"
				},
				{
					text: "Name"// & IBAN"
				},
				{
					text: "IBAN"
				},
				{
					text: "REMI"
				}
			],
			body: tableBodyDebet
		};
	
		var cards1 = [];
		var cards2 = [];
		
		cards1.push({
			type: "card",
			width: ['lg-8', 'md-12'],
			header: {
				title: "Credit (Af)"
			},
			table: tableDebet
		});
		
		cards2.push({
			type: "card",
			width: ['lg-8', 'md-12'],
			header: {
				title: "Transactions"
			},
			table: tableCredit
		});
		
		this.app.showPage({
			header: {
				title: "MT940 import tool"
			},
			body: 
				[[
					/*{
						width: "lg-6",
						elements: cards1
					},*/
					{
						//width: "lg-6",
						elements: cards2
					}
				]]
			
		});
	}
	
	submitForm(form, method) {
		spacecore.submitForm(this.submitFormHandler.bind(this, form, method), form, method);
	}
	
	submitFormHandler(form, method, res, err) {
		var action = "show()";
		var actionFunc = spacecore.currentModule.show;
		var skip = false;
		
		if (err) {
			this.app.showMessage2(
				[
					err.message
				],
				"MT940",
				"Error",
				[
					{
						type: "button",
						value: "OK",
						action: "javascript:spacecore.currentModule."+action+";"
					}
				]
			);
		} else {
			console.log("MT940", res);
			this.showResult(res);
		}
	}
};
