class Files {
	constructor( opts ) {
		this.name = 'files';
		
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
		if (menu === 'main') {
			if (this.app.checkPermission('file/list')) items.push({
				label: "Files",
				fe_icon: "file",
				action: "javascript:spacecore.action('"+this.name+"', null, true);"
			});
		}
		return items;
	}
		
	/* Module */
	
	show(reset=true, part="files") {
		if (reset) this.reset();
		this.app.currentModule = this;
		this.app.executeCommand('file/list', {}, this._handleShow.bind(this));
	}
	
	fileAdd() {
		this.app.showPage({
			header: {
				title: "Files",
				options: []
			},
			body: [
				[
					[
						{
							type: "card",
							width: ['lg-8', 'md-12'],
							header: {
								title: "Upload file"
							},
							form: {
								id: "addfile-form",
								elements: [
									{
										type: "file",
										name: "file",
										label: "File",
										default: "Select a file to upload...",
										id: "file",
										value: ""
									}
								],
								footer: [
										{
											type: "button",
											action: "javascript:spacecore.currentModule.show();",
											fe_icon: "x",
											value: "Cancel",
											class: "secondary"
										},
										{
											type: "button",
											action: "javascript:spacecore.currentModule.submitForm('addfile-form','file/add')",
											fe_icon: "save",
											value: "Upload file",
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
	
	fileGet(id) {
		this.app.executeCommand('file/get', id, this._fileGetHandler.bind(this));
	}
	
	_fileGetHandler(res, err) {
		if (err !== null) return this.genericErrorHandler(err);
		var element = document.createElement('a');
		element.setAttribute('href', 'data:'+res.mime+';base64,'+res.data);
		element.setAttribute('download', res.name);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}
	
	fileRemove(id) {
		//TODO: Add confirmation dialog
		this.app.executeCommand('file/remove', id, this._fileRemoveHandler.bind(this));
	}
	
	_fileRemoveHandler(res, err) {
		if (err !== null) return this.genericErrorHandler(err);
		console.log("File remove result", res);
		this.show();
	}
	
	/* Form handling */
		
	submitForm(form, method) {
		spacecore.submitForm(this.submitFormHandler.bind(this, form, method), form, method);
	}
	
	submitFormHandler(form, method, res, err) {
		if (err !== null) return this.genericErrorHandler(err);
		console.log("Form result", res);
		return this.show();
	}

	_renderFiles(res) {		
		var table = {
			id: "table_files",
			header: [
				{
					width: 1,
					text_center: true,
					text: "ID"
				},
				{
					text: "Name"
				},
				{
					text: "MIME"
				},
				{
					width: 1
				},
				{
					width: 1
				}
			],
			body: []
		};
		
		for (var i in res) {			
			table.body.push({
				id: "file-"+res[i].id,
				fields: [
					{
						text: res[i].id
					},
					{
						text: res[i].name
					},
					{
						text: res[i].mime
					},
					{
						elements: [
							{
								type: "button",
								action: "javascript:spacecore.currentModule.fileGet("+res[i].id+");",
								fe_icon: "download"
							}
						]
					},
					{
						elements: [
							{
								type: "button",
								action: "javascript:spacecore.currentModule.fileRemove("+res[i].id+");",
								fe_icon: "trash-2",
								class: "secondary"
							}
						]
					}
				]
			});
		}
		return table;
	}
	
	genericErrorHandler(err, action="show()") {
		var message = "Unknown error!";
		
		if ((typeof err === 'object') && (typeof err.message === 'string')) {
			message = err.message;
		} else if (typeof err === 'string') {
			message = err;
		} else {
			console.log("Invalid argument supplied to error handler", err);
		}
		
		this.app.showMessage2(
			message,
			"Files",
			"Error",
			[
				{
					type: "button",
					value: "OK",
					action: "javascript:spacecore.currentModule."+action+";"
				}
			]
		);
	}
	
	_handleShow(res, err) {
		if (err !== null) {
			return this.genericErrorHandler(err);
		}
		
		var filesTable = this._renderFiles(res);
				
		this.app.showPage({
			header: {
				title: "Files",
				options: [
						{
							"type":"button",
							"fe_icon": "file",
							"action":  "javascript:spacecore.currentModule.fileAdd();",
							"value": "Upload a file",
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
								title: "Files",
								options: [
									{
										type: "button",
										action: "javascript:spacecore.currentModule.fileAdd();",
										fe_icon: "plus",
										small: true
									}
								]
							},
							table: filesTable
						}
					]
				]
			]
		});
	}
};
