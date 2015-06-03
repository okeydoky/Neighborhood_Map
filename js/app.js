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
                },
                vicinity : '216 East 10th Street, New York',
                place_id : 'ChIJ8fdYs51ZwokRA71PKvTvXG4'
            }, {
                title : 'Apollo Theater',
                position : {
                    lat : 40.809691,
                    lng : -73.949797
                },
                vicinity : '253 West 125th Street, New York',
                place_id : 'ChIJRaWCMm32wokRLdyc4zmYzRw'
            }, {
                title : "Rudy's Bar & Grill",
                position : {
                    lat : 40.760045,
                    lng : -73.991853
                },
                vicinity : '627 9th Avenue, New York',
                place_id : 'ChIJOxerSlJYwokRPmpdLA4CpWI'
            } ]

        },

        initCord : {},
        markerList : null, // @type observableArray
        searchResults : ko.observableArray(),
        markerListCache : [],   // keep original marker list when filtering the result

        init : function() {
            // restore model state from local storage or set to default
            if (!localStorage.initCord) {
                this.saveInitCord(this.defaults.initCord);
            }
            model.initCord = JSON.parse(localStorage.initCord);

            if (!localStorage.markerList) {
                localStorage.markerList = JSON
                        .stringify(this.defaults.markerList);
            }
            model.markerList = ko.observableArray(JSON
                    .parse(localStorage.markerList));
        },

        saveInitCord : function(latlng) {
            localStorage.initCord = JSON.stringify(latlng);
        },

        // populate searchResults, taking response from Google Place library as
        // input
        populateSearchResults : function(results) {
            var resultArray = [];
            results.forEach(function(result, idx) {
                // name, position, vicinity, place_id
                if (idx < 5) {
                    resultArray.push({
                        name : result.name,
                        position : result.geometry.location,
                        vicinity : result.vicinity,
                        place_id : result.place_id
                    });
                }
            });

            // replace original array all at once for performance
            model.searchResults(resultArray);
        },
        
        // add new place into marker list, also serialize to local storage
        addToFavorite : function(data) {
            model.markerList.push({
               title: data.name,
               position: {lat: data.position.lat(), lng: data.position.lng()},
               vicinity: data.vicinity,
               place_id: data.place_id
            });
            localStorage.markerList = JSON.stringify(model.markerList());
        },
        
        // remove favorite from marker list, also serialize to local storage
        removeFromFavorite : function(data) {
            model.markerList.remove(function(item) {
               return item.place_id == data.place_id; 
            });
            localStorage.markerList = JSON.stringify(model.markerList());
        },
        
        // filter favorite list by search term
        filterFavorite : function(term) {
            term = term || '';
            
            // restore to original list when nothing to filter
            if (term == '') {
                model.markerList(model.markerListCache);
                return;
            }
            
            // cache original list if not done so already
            if (model.markerListCache.length == 0) {
                model.markerListCache = model.markerList();
            }
            
            // filter marker list based on search term
            model.markerList(model.markerListCache.filter(function(item) {
                return item.title.toLowerCase().indexOf(term.toLowerCase()) != -1;
            }));
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
            this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            //this.markerArray = [];
            this.markerSet = {};
            this.searchResultMarkers = [];

            // add markers if any
            if (markers) {
                markers.forEach(function(m) {
                    /*
                    this.markerArray.push(new google.maps.Marker({
                        position : m.position,
                        map : this.map,
                        title : m.title
                    }));
                    */
                    this.markerSet[m.place_id] = new google.maps.Marker({
                        position : m.position,
                        map : this.map,
                        title : m.title
                    });
                }, this);
            }

            // create search box
            var searchInput = document.getElementById('map-searchbox');
            this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchInput);
        },

        reCenter : function(latlng) {
            this.map.panTo(latlng);
        },

        hideMarkers : function() {
            /*
            this.markerArray.forEach(function(marker) {
                marker.setVisible(false);
            });
            */
            for (var place_id in this.markerSet) {
                this.markerSet[place_id].setVisible(false);
            }
        },

        showMarkers : function() {
            /*
            this.markerArray.forEach(function(marker) {
                marker.setVisible(true);
            });
            */
            for (var place_id in this.markerSet) {
                this.markerSet[place_id].setVisible(true);
            }
        },

        syncMarkers : function(markers) {
            var newSet = {};
            var markerSet = this.markerSet;

            // Add marker to marker set if not already presented
            markers.forEach(function(marker) {
                if (!(marker.place_id in markerSet)) {
                    markerSet[marker.place_id] =
                        new google.maps.Marker({
                            position : marker.position,
                            map : this.map,
                            title : marker.title
                        });
                }
                newSet[marker.place_id] = 1;
            }, this);
            
            // Remove marker from set if it's being deleted
            for (var place_id in markerSet) {
                if (!(place_id in newSet)) {
                    markerSet[place_id].setMap(null);
                    delete markerSet[place_id];
                }
            }
        },
                
        showSearchResultMarkers : function(results) {
            // hide favorite place markers first
            this.hideMarkers();

            // clear old search results
            this.hideSearchResultMarkers();
            this.searchResultMarkers = [];

            // add new result markers
            results.forEach(function(result) {
                this.searchResultMarkers.push(new google.maps.Marker({
                    position : result.position,
                    map : this.map,
                    title : result.name
                }));
            }, this);
        },
        
        hideSearchResultMarkers : function() {
            this.searchResultMarkers.forEach(function(marker) {
                marker.setMap(null);
            });
        }
    };

    var leftPanelView = {
        showSearchResult : function() {
            $('#search-results').removeClass('hidden');
        },
        
        hideSearchResult : function() {
            $('#search-results').addClass('hidden');
        }
    };
    
    var ViewModel = function() {
        var self = this;

        model.init();
        mapView.init(model.initCord, model.markerList());

        self.markerList = model.markerList;   
        // wire up map markers in sync with model's markerList observable array
        self.markerList.subscribe(mapView.syncMarkers, mapView);
        
        self.searchResults = model.searchResults;
        self.searchTerm = ko.observable();
        self.filterTerm = ko.observable();
        // filter favorite list when filterTerm changes
        self.filterTerm.subscribe(function() {
            var term = self.filterTerm();
            model.filterFavorite(term);
        });
        
        self.addFavorite = function(data) {
            model.addToFavorite(data);
        };

        self.removeFavorite = function(data) {
            model.removeFromFavorite(data);
        };
        
        self.centerThis = function(data) {
            mapView.reCenter(data.position);
        };
        
        // search the map using Google places library
        self.search = function(data, event) {
            var $input = $(event.target);
            var map = mapView.map;
            var request = {
                bounds : map.getBounds(),
                keyword : $input.val()
            };
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, self.displaySearchResult);
        };

        self.displaySearchResult = function(results) {
            model.populateSearchResults(results);
            mapView.showSearchResultMarkers(model.searchResults());
            leftPanelView.showSearchResult();
        };
        
        self.hideSearchResult = function() {
            leftPanelView.hideSearchResult();
            mapView.hideSearchResultMarkers();
            self.searchTerm('');
            mapView.showMarkers();
        };
        
        /** 
         * Event handler when list item from favorites or search results is clicked
         * @param {Object} data, list item being clicked, passed from ko
         */
        self.itemClicked = function(data) {
            self.centerThis(data);
            self.searchYelp(data);
        };
        
        /**
         * Search Yelp review API
         * @param {Object} data, list item being clicked
         */
        self.searchYelp = function(data) {
            console.dir(data);
            // Prepare for OAuth required by Yelp
            var oauth = OAuth({
                consumer: {
                    public: 'nFTOifOTq-F16Q8wmsNZWA',
                    secret: 'EElaO7MYNLSQFHBYGath4TVPtNo'
                },
                signature_method: 'HMAC-SHA1'
            });
            
            var request_data = {
                    url: 'http://api.yelp.com/v2/search/',
                    method: 'GET',
                    data: {
                        term: data.title,
                        location: data.vicinity,
                        callback: 'cb'
                    }
                };
            
            var token = {
                public: 'Z3n8YsiXufXKyX6o3m5A_PHLF0iliBtu',
                secret: 'soKNxFDmBaeciFI_XGQuMaD7sQg'
            };
            
            // Send the request
            
            $.ajax({
                url: request_data.url,
                type: request_data.method,
                dataType: 'jsonp',
                jsonpCallback: 'cb',
                cache: true,
                data: oauth.authorize(request_data, token),
                success: function(response) {
                    console.dir(response);
                }
            });
            
            /*
            $.getJSON(request_data.url, oauth.authorize(request_data, token))
            .done(function(response) {
                console.dir(response);
            });
            */
        };
    };

    // start the application!!
    ko.applyBindings(new ViewModel());

});

