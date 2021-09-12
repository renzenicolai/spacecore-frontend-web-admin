class Reports {
	constructor( opts ) {
		opts = Object.assign({
			name: 'reports'
		}, opts);
		this.name = opts.name;
	}

	menu(menu='main') {
		var items = [];
		if (menu === 'main') {
			items.push({
				label: "Reports",
				fe_icon: "pie-chart",
				action: "javascript:spacecore.action('"+this.name+"', null, true);"
			});
		}
		return items;
	}

	show(reset=true, part="reports") {
		spacecore.currentModule = this;
		spacecore.history = [];
		window.location.href = "#";
        let reportoptions = "";
        let currentYear = new Date().getFullYear();
        for (let year = 2019; year <= currentYear; year++) {
            let incomplete = (year === currentYear) ? " (thus far)" : "";
            reportoptions += "<a href='#' onclick='spacecore.currentModule.transactions("+year+");'>Full transaction log for "+year+incomplete+" [CSV]</a><br />";
        }
        reportoptions += "<br />";
        for (let year = 2019; year <= currentYear; year++) {
            let incomplete = (year === currentYear) ? " (thus far)" : "";
            reportoptions += "<a href='#' onclick='spacecore.currentModule.summary("+year+");'>Summary for "+year+incomplete+" [CSV]</a><br />";
        }
		spacecore.showPage({
			header: { title: "Reports", options: []},
			body: [[[{ type: "card", raw: reportoptions}]]]
		}, []);
        spacecore.history.push(this.show.bind(this, false, "reports"));
	}
	
	transactions(year) {
		spacecore.showPage({
			header: { title: "Reports", options: []},
			body: [[[{ type: "card", raw: "Please wait, generating transaction log for "+year+"..."}]]]
		}, []);
        spacecore.executeCommand('report/transactions', year, this._handleDownloadResponse.bind(this));
    }
    
    summary(year) {
		spacecore.showPage({
			header: { title: "Reports", options: []},
			body: [[[{ type: "card", raw: "Please wait, generating summary for "+year+"..."}]]]
		}, []);
        spacecore.executeCommand('report/summary', year, this._handleDownloadResponse.bind(this));
    }
    
    _handleDownloadResponse(res, err) {
        if (err) {
            spacecore.showPage({
                header: { title: "Reports", options: []},
                body: [[[{ type: "card", raw: "Failed to generate report<br /><br />" + err.message + "<br /><br /><a href='#' onclick='spacecore.action(\""+this.name+"\", null, true);'>Go back</a>"}]]]
            }, []);
        } else {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:'+res.mime+';base64,'+res.data);
            element.setAttribute('download', res.name);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            spacecore.action(this.name, null, true);
        }
    }
};
