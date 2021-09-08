class Users {
	constructor( opts ) {
		this.name = 'users';
		
		opts = Object.assign({
			ui: null,
			app: null
		}, opts);
		
		this.ui = opts.ui;
		this.app = opts.app;
		
		this.reset();
	}
	
	reset() {
		this.state = {
			lastSelected: null,
			searchText: "",
			sortBy: "user_name",
			sortReverse: false,
			lastData: null
		};
	}
	
	menu(menu='main') {
		var items = [];
		if (menu === 'main') {
			if (this.app.checkPermission('user/list')) items.push({
				label: "Users",
				fe_icon: "users",
				action: "javascript:spacecore.action('"+this.name+"');"
			});
		}
		return items;
	}
	
	show(reset=true) {
		if (reset) this.reset();
		this.app.currentModule = this;
		this.app.executeCommand('user/list', {}, this._handleShow.bind(this));
	}
	
	search(elem='users-search') {
		this.state.searchText = document.getElementById(elem).value;
		
		var filtered = this.app.sort(
			this.app.filter(
				this.state.lastData,
				this.state.searchText,
				['user_name', 'full_name', 'title'],
				false),
			this.state.sortBy,
			this.state.sortReverse);
		
		var content = this.ui.renderTemplate('table', this._renderUsers(filtered));
		document.getElementById('table_users').innerHTML = content;
	}
	
	/*changeSort(field) {
		if (this.state.sortBy === field) {
			this.state.sortReverse = !this.state.sortReverse;
		} else {
			this.state.sortReverse = false;
			this.state.sortBy = field;
		}
		this.search();
	}*/
	
	_getSortIcon(field) {
		/*if (this.state.sortBy !== field) return null;
		if (this.state.sortReverse) return "chevron-up";
		return "chevron-down";*/
		return "";
	}
		
	_renderUsers(res) {		
		var table = {
			id: "table_users",
			header: [
				{
					fe_icon: "user",
					width: 1,
					text_center: true,
					//action: "javascript:spacecore.findModule('"+this.name+"', true).changeSort('id');",
					fe_icon_after: this._getSortIcon('id')
				},
				{
					text: "Username",
					//action: "javascript:spacecore.findModule('"+this.name+"', true).changeSort('user_name');",
					fe_icon_after: this._getSortIcon('user_name')
				},
				{
					text: "Full name",
					//action: "javascript:spacecore.findModule('"+this.name+"', true).changeSort('full_name');",
					fe_icon_after: this._getSortIcon('full_name')
				},
				{
					text: "Title",
					//action: "javascript:spacecore.findModule('"+this.name+"', true).changeSort('title');",
					fe_icon_after: this._getSortIcon('title')
				},
				{
					width: 1
				}
			],
			body: []
		};
		
		for (var i in res) {
			table.body.push({
				id: "person-"+res[i].id,
				fields: [
					{
						action: "javascript:spacecore.findModule('"+this.name+"', true).showDetails("+res[i].id+");",
						avatar: res[i].avatar,
						text_center: true
					},
					{
						action: "javascript:spacecore.findModule('"+this.name+"', true).showDetails("+res[i].id+");",
						text: res[i].user_name
					},
					{
						action: "javascript:spacecore.findModule('"+this.name+"', true).showDetails("+res[i].id+");",
						text: res[i].full_name
					},
					{
						action: "javascript:spacecore.findModule('"+this.name+"', true).showDetails("+res[i].id+");",
						text: res[i].title
					},
					{
						text_center: true,
						menu: [
							{
								action: "javascript:spacecore.findModule('"+this.name+"', true).showDetails("+res[i].id+");",
								fe_icon: "info",
								label: "Details"
							},
							{
								action: "javascript:void(0);",
								fe_icon: "share-2",
								label: "Share"
							},
							{
								action: "javascript:void(0);",
								fe_icon: "trash-2",
								label: "Delete"
							},
						]
					}
				]
			});
		}
		return table;
	}
	
	_handleShow(res, err) {
		if (err !== null) {
			this.app.showMessage(err.message);
			return;
		}
		
		this.state.lastData = res;
		
		var usersTable = this._renderUsers(
			this.app.sort(
				this.app.filter(
					res,
					this.state.searchText,
					['user_name', 'full_name', 'title'],
					false
				),
				this.state.sortBy,
				this.state.sortReverse
			)
		);
				
		this.app.showPage({
			header: {
				title: "Users",
				options: [
						{
							type:"text",
							id: "users-search",
							fe_icon: "search",
							placeholder: "Search users...",
							action:  "javascript:spacecore.findModule('"+this.name+"', true).search();",
							value: this.state.searchText
						}
					]
			},
			body: [
				[
					[
						{
							type: "card",
							header: {
								title: "Users",
								options: [
									{
										type: "button",
										action: "javascript:void(0);",
										fe_icon: "plus",
										small: true
									}
								]
							},
							table: usersTable
						}
					]
				]
			]
		});
		
		$(function() { $("#table_users_table").tablesorter(); });
		
		if (this.state.lastSelected !== null) window.location.href = "#user-"+this.state.lastSelected;
	}
	
	showDetails(id) {
		this.state.lastSelected = id;
		this.app.executeCommand('user/details',id,this._handleShowDetails.bind(this));
	}
	
	_handleShowDetails(res, err) {
		if (err !== null) {
			console.log("handlePersonDetails error ",err);
			this.app.showMessage(err.message);
			return;
		}
		
		this.app.history.push(this.show.bind(this, false));
		
		var table_address = {
			id: "table_address",
			header: [
				"Address",
				{
					width: 1
				}
			],
			body: []
		};
		
		for (var i in res.address) {
			table_address.body.push({
				id: "address-"+res.address[i].id,
				fields: [
					{
						text: res.address[i].address
					},
					{
						text_center: true,
						menu: [
							{
								action: "javascript:spacecore.findModule('"+this.name+"', true).editAddress("+res.id+", "+res.address[i].id+");",
								fe_icon: "edit",
								label: "Details"
							},
							{
								action: "javascript:spacecore.findModule('"+this.name+"', true).deleteAddress("+res.id+", "+res.address[i].id+");",
								fe_icon: "trash-2",
								label: "Delete"
							},
						]
					}
				]
			});
		}
		
		var table_bankaccount = {
			id: "table_bankaccount",
			header: [
				"IBAN",
				{
					width: 1
				}
			],
			body: []
		};
		
		for (var i in res.bankaccount) {
			table_bankaccount.body.push({
				id: "bankaccount-"+res.bankaccount[i].id,
				fields: [
					{
						text: res.bankaccount[i].iban,
					},
					{
						text_center: true,
						menu: [
							{
								action: "javascript:spacecore.findModule('"+this.name+"', true).editBankaccount("+res.id+", "+res.bankaccount[i].id+");",
								fe_icon: "edit",
								label: "Details"
							},
							{
								action: "javascript:spacecore.findModule('"+this.name+"', true).deleteBankaccount("+res.id+", "+res.bankaccount[i].id+");",
								fe_icon: "trash-2",
								label: "Delete"
							},
						]
					}
				]
			});
		}
		
		var table_email = {
			id: "table_email",
			header: [
				"Email address",
				{
					width: 1
				}
			],
			body: []
		};
		
		for (var i in res.email) {
			table_email.body.push({
				id: "email-"+res.email[i].id,
				fields: [
					{
						text: res.email[i].address,
					},
					{
						text_center: true,
						menu: [
							{
								action: "javascript:spacecore.findModule('"+this.name+"', true).editEmail("+res.id+", "+res.email[i].id+");",
								fe_icon: "edit",
								label: "Details"
							},
							{
								action: "javascript:spacecore.findModule('"+this.name+"', true).deleteEmail("+res.id+", "+res.email[i].id+");",
								fe_icon: "trash-2",
								label: "Delete"
							},
						]
					}
				]
			});
		}
				
		var table_phone = {
			id: "table_phone",
			header: [
				"Phone number",
				{
					width: 1
				}
			],
			body: []
		};
		
		for (var i in res.phone) {
			table_phone.body.push({
				id: "phone-"+res.phone[i].id,
				fields: [
					{
						text: res.phone[i].number,
					},
					{
						text_center: true,
						menu: [
							{
								action: "javascript:spacecore.findModule('"+this.name+"', true).editPhone("+res.id+", "+res.phone[i].id+");",
								fe_icon: "edit",
								label: "Details"
							},
							{
								action: "javascript:spacecore.findModule('"+this.name+"', true).deletePhone("+res.id+", "+res.phone[i].id+");",
								fe_icon: "trash-2",
								label: "Delete"
							},
						]
					}
				]
			});
		}
		
		var table_group = {
			id: "table_group",
			header: [
				"Group",
				{
					width: 1
				}
			],
			body: []
		};
		
		for (var i in res.group) {
			table_group.body.push({
				id: "group-"+res.group[i].id,
				fields: [
					{
						text: res.group[i].name,
					},
					{
						text_center: true,
						menu: [
							{
								action: "javascript:spacecore.findModule('"+this.name+"', true).removeGroup("+res.id+", "+res.group[i].id+");",
								fe_icon: "trash-2",
								label: "Remove group from person"
							},
						]
					}
				]
			});
		}
				
		this.app.showPage({
			header: {
				title: "Person details",
				options: [
						{
							"type":"button",
							"fe_icon": "chevron-left",
							"action":  "javascript:spacecore.handleBackButton();",
							"value": "Back",
							"class": "secondary"
						}
					]
			},
			body: [
				[{
					width: "lg-4",
					elements: [
						{
							type: "card",
							padding: 5,
							media: {
								avatar: res.avatar,
								name: res.full_name,
								comment: res.user_name,
								buttons: ""
							}
						},
						{
							type: "card",
							header: {
								title: "Groups",
								options: [
									{
										type: "button",
										action: "javascript:void(0);",
										fe_icon: "plus",
										small: true
									}
								]
							},
							table: table_group
						}
					]
				},
				{
					width: ["lg-8", "md-12"],
					elements: [
						{
							type: "card",
							header: {
								title: "Addresses",
								options: [
									{
										type: "button",
										action: "javascript:void(0);",
										fe_icon: "plus",
										small: true
									}
								]
							},
							table: table_address
						},
						{
							type: "card",
							header: {
								title: "Bankaccounts",
								options: [
									{
										type: "button",
										action: "javascript:void(0);",
										fe_icon: "plus",
										small: true
									}
								]
							},
							table: table_bankaccount
						},
						{
							type: "card",
							header: {
								title: "Email addresses",
								options: [
									{
										type: "button",
										action: "javascript:void(0);",
										fe_icon: "plus",
										small: true
									}
								]
							},
							table: table_email
						},
						{
							type: "card",
							header: {
								title: "Phone numbers",
								options: [
									{
										type: "button",
										action: "javascript:void(0);",
										fe_icon: "plus",
										small: true
									}
								]
							},
							table: table_phone
						}
					]
				}]
			]
		});
		this.app.jumpToTop();
	}
	
	editAddress(person_id, address_id) {
		this.app.executeCommand('user/address/get', address_id, this.handleEditAddress.bind(this, person_id));
	}
	
	handleEditAddress(person_id, res, err) {
		if (err !== null) return this.app.showMessage(err.message);
		this.app.history.push(this.showDetails.bind(this, person_id));
		
		/*this.showEditDialog("", "Edit address", [{
			"type":"textarea",
			"id": "input-address",
			"label":"Address",
			"value": res.address
		}], this.editAddressResultHandler.bind(this));*/
			this.app.showPage({
			header: {
				title: "Edit address",
				options: [
						{
							"type":"button",
							"fe_icon": "chevron-left",
							"action":  "javascript:spacecore.handleBackButton();",
							"value": "Back",
							"class": "secondary"
						}
					]
			},
			body: [
				[
					[
						{
							type: "card",
							header: {
								title: "Edit address"
							},
							form: {
								"action": "javascript:void(0);",
								"elements": [
									{
										"type":"textarea",
										"id": "inputAddress",
										"fe_icon": "house",
										"label":"Address",
										"placeholder":"Address",
										"value": res.address
									}
								],
								"footer": [
									{
										"type":"button",
										"action": "submit",
										"value":"Save",
										"block": true
									}
								]
							}
						}
					]
				]
			]
		});
		this.app.jumpToTop();
	}
	
	editAddressResultHandler(res) {
		console.log("editPersonAddressResultHandler stub", res);
	}
};
 
