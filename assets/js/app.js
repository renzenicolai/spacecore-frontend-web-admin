require.config({
	shim: {
		'bootstrap': ['jquery'],
		'sparkline': ['jquery'],
		'tablesorter': ['jquery'],
		'vector-map': ['jquery'],
		'vector-map-de': ['vector-map', 'jquery'],
		'vector-map-world': ['vector-map', 'jquery'],
		'tabler-core': ['bootstrap', 'jquery'],
		'handlebars': [],
		'circle-progress': [],
		'spacecore-persons': [],
		'spacecore-users': [],
		'spacecore-login': [],
		'spacecore-products': [],
		'spacecore-dashboard': [],
		'spacecore-files': [],
		'spacecore-ui': ['handlebars', 'tablesorter'],
		'spacecore': ['tabler-core', 'input-mask', 'spacecore-ui', 'spacecore-persons', 'spacecore-users', 'spacecore-login', 'spacecore-dashboard', 'spacecore-files', 'spacecore-mt940','spacecore-products', 'circle-progress'],
	},
	paths: {
		'tabler-core': 'assets/js/vendors/tabler-core',
		'jquery': 'assets/js/vendors/jquery-3.2.1.min',
		'bootstrap': 'assets/js/vendors/bootstrap.bundle.min',
		'sparkline': 'assets/js/vendors/jquery.sparkline.min',
		'selectize': 'assets/js/vendors/selectize.min',
		'tablesorter': 'assets/js/vendors/jquery.tablesorter.min',
		'vector-map': 'assets/js/vendors/jquery-jvectormap-2.0.3.min',
		'vector-map-de': 'assets/js/vendors/jquery-jvectormap-de-merc',
		'vector-map-world': 'assets/js/vendors/jquery-jvectormap-world-mill',
		'circle-progress': 'assets/js/vendors/circle-progress.min',
		'handlebars': 'assets/js/vendors/handlebars-v4.0.11',
		'spacecore-ui': 'assets/js/spacecore/ui',
		'spacecore': 'assets/js/spacecore/main',
		'spacecore-persons': 'assets/js/spacecore/modules/persons',
		'spacecore-users': 'assets/js/spacecore/modules/users',
		'spacecore-login': 'assets/js/spacecore/modules/login',
		'spacecore-dashboard': 'assets/js/spacecore/modules/dashboard',
		'spacecore-mt940': 'assets/js/spacecore/modules/mt940',
		'spacecore-products': 'assets/js/spacecore/modules/products',
		'spacecore-files': 'assets/js/spacecore/modules/files',
	}
});

function startApplication(common=null) {
	
	var location = window.location.href.split('/');
	var protocol = location[0];
	var domain = location[2];
		
	var apiUrl = '';
	
	if (protocol === 'http:') {
		apiUrl = 'ws://'+domain+"/api/";
	} else if (protocol === 'https:') {
		apiUrl = 'wss://'+domain+"/api/";
	} else {
		console.log('Unknown protocol ('+protocol+')!');
		document.getElementById('message').innerHTML = 'Unknown protocol ('+protocol+')! Can not connect to websocket server.';
	}
			
	if (apiUrl !== '') {
		window.spacecore = new Spacecore({
			apiUrl: apiUrl
		});
		
		if (typeof history.pushState === "function") {
				history.pushState("spacecore-A", null, null);
				window.onpopstate = function (event) {
					console.log(event);
					history.pushState('spacecore-B', null, null);
					spacecore.handleBackButton();
				};
		}

	}
}

require(['tabler-core', 'spacecore'], startApplication);
//window.onload = startApplication;
