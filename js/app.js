$(function() {
    var model = {
        // default value for model properties
        defaults : {
            initCord : { // Manhattan, NYC
                lat : 40.779529,
                lng : -73.955305
            },
            markerList : [ {
                title : 'Shabu-Tatsu',
                position : {
                    lat : 40.729167,
                    lng : -73.985917
                }
            }, {
                title : 'Apollo Theater',
                position : {
                    lat : 40.809691,
                    lng : -73.949797
                }
            }, {
                title : "Rudy's Bar & Grill",
                position : {
                    lat : 40.760045,
                    lng : -73.991853
                }
            } ]

        },

        initCord : {},
        markerList : null,

        init : function() {
            // restore model state from local storage or set to default
            if (!localStorage.initCord) {
                this.saveInitCord(this.defaults.initCord);
            }
            model.initCord = JSON.parse(localStorage.initCord);
            
            if (!localStorage.markerList) {
                localStorage.markerList = JSON.stringify(this.defaults.markerList);
            }
            model.markerList = ko.observableArray(JSON.parse(localStorage.markerList));
        },

        saveInitCord : function(latlng) {
            localStorage.initCord = JSON.stringify(latlng);
        }
    };

    // Map Canvas Area
    var mapView = {
        init : function(latlng, markers) {
            // create map
            var mapOptions = {
                center : {
                    lat : latlng.lat,
                    lng : latlng.lng
                },
                zoom : 13
            };
            var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            this.map = map;
            this.markerArray = [];
            
            // add markers if any
            if (markers) {
                markers.forEach(function(m) {
                   this.markerArray.push(new google.maps.Marker({
                       position: m.position,
                       map: map,
                       title: m.title
                   })); 
                }, this);
            }
        },

        reCenter : function(latlng) {
            this.map.setCenter(latlng);
        }
    };

    var ViewModel = function() {
        var self = this;
        
        model.init();
        mapView.init(model.initCord, model.markerList());
        
        self.markerList = model.markerList;
        /*
         * Necessary? // wire up map re-center callback
         * model.initCord.subscribe(function(latlng) { mapView.reCenter(latlng);
         * });
         */
        self.addMarker = function(data) {
            
        };
    };

    // start the application!!
    ko.applyBindings(new ViewModel());

});
