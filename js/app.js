$(function() {
	var model = {
		initCord : ko.observable(),
		
		init : function() {
			// restore model state from local storage or set to default
			if (!localStorage.initCord) {
				// default to New York City
				this.setInitCord({
					lat : 40.779529,
					lng : -73.955305
				});
			}
			model.initCord = ko.observable(JSON.parse(localStorage.initCord));
		},

		setInitCord : function(latlng) {
			localStorage.initCord = JSON.stringify(latlng);
			model.initCord(latlng);
		}
	};

	// Map Canvas Area
	var mapView = {
		init : function(latlng) {
			var mapOptions = {
				center : {
					lat : latlng.lat,
					lng : latlng.lng
				},
				zoom : 14
			};
			this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		},

		reCenter : function(latlng) {
			this.map.setCenter(latlng);
		}
	};

	var ViewModel = function() {
		model.init();
		mapView.init(model.initCord());

		// wire up map re-center callback
		model.initCord.subscribe(function(latlng) {
			mapView.reCenter(latlng);
		});
	};

	// start the application!!
	ko.applyBindings(new ViewModel());
	
});
