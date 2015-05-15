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
        markerList : null,  // @type observableArray
        searchResults : ko.observableArray(),

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
        },
        
        // populate searchResults, taking response from Google Place library as input
        populateSearchResults : function(results) {
            var resultArray = [];
            results.forEach(function(result) {
                // name, position, vicinity, place_id
                resultArray.push({
                   name: result.name,
                   location: result.geometry.location,
                   vicinity: result.vicinity,
                   place_id: result.place_id
                });
            });
            
            // replace original array all at once for performance
            model.searchResults(resultArray);
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

    // view for collecting user inputs
    var inputView = {
        showSearch : function(event) {
            $('#search-input').removeClass('hidden');
            $('#filter-input').addClass('hidden');
            this.clearActive();
            $(event.target).addClass('active');
        },
        
        showFilter : function(event) {
            $('#search-input').addClass('hidden');
            $('#filter-input').removeClass('hidden');
            this.clearActive();
            $(event.target).addClass('active');
        },
        
        hideInputs : function() {
            $('#search-input').addClass('hidden');
            $('#filter-input').addClass('hidden');
            this.clearActive();
        },
        
        // clear active states for all buttons
        clearActive : function() {
            $('#menu-btns button').removeClass('active');
        }
    };
    
    var ViewModel = function() {
        var self = this;
        
        model.init();
        mapView.init(model.initCord, model.markerList());
        
        self.markerList = model.markerList;
        self.searchResults = model.searchResults;
        
        /*
         * Necessary? // wire up map re-center callback
         * model.initCord.subscribe(function(latlng) { mapView.reCenter(latlng);
         * });
         */
        self.addMarker = function(data) {
            
        };
        
        // show search input for adding favorite
        self.showSearch = function(data, event) {
            inputView.showSearch(event);
        };
        
        // show filter input for filtering favorite
        self.showFilter = function(data, event) {
            inputView.showFilter(event);
        };
        
        // hide all input boxes
        self.hideInputs = function() {
            inputView.hideInputs();
        };
        
        // search the map using Google places library
        self.search = function(data, event) {
            var $input = $(event.target);
            var map = mapView.map;
            var request = {
              bounds: map.getBounds(),
              keyword: $input.val()
            };
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, self.displaySearchResult);
        };
        
        self.displaySearchResult = function(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                model.populateSearchResults(results);
            } else {
                //@Todo: add error handling later
                alert('Oops!!');
            }
            console.dir(results);
        };
    };

    // start the application!!
    ko.applyBindings(new ViewModel());

});
