$(function() {
    /**
     * Model object. This object handle all the data processes, persistent etc.
     */
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
        markerList : ko.observableArray(), 
        searchResults : ko.observableArray(),
        markerListCache : [],   // keep original marker list when filtering the result
        yelpResults : ko.observableArray(),

        /**
         * Initialize model object from local storage or read from defaults.
         */
        init : function() {
            // restore model state from local storage or set to default
            if (!localStorage.initCord) {
                this.saveInitCord(this.defaults.initCord);
            }
            model.initCord = JSON.parse(localStorage.initCord);

            if (!localStorage.markerList) {
                localStorage.markerList = JSON.stringify(this.defaults.markerList);
            }
            model.markerList(JSON.parse(localStorage.markerList));
        },

        /**
         * Save initial center point to local storage
         * @param {object} latlng, an object with lat, lng properties
         */
        saveInitCord : function(latlng) {
            localStorage.initCord = JSON.stringify(latlng);
        },

        /**
         * Populate searchResults
         * @param {Array[object]} results, response from Google Place library
         */
        populateSearchResults : function(results) {
            var resultArray = [];
            results.forEach(function(result, idx) {
                var position = result.geometry.location;
                
                if (idx < 5) {  // show only up to 5 results
                    resultArray.push({
                        title : result.name,
                        position : {lat: position.lat(), lng: position.lng()},
                        vicinity : result.vicinity,
                        place_id : result.place_id
                    });
                }
            });

            // replace original array all at once for performance
            model.searchResults(resultArray);
        },
        
        /**
         * populate yelpResults from Yelp Search API
         * @param {Array[object]} results, businesses property from Yelp Search API returned object
         */
        populateYelpResults : function(results) {
            var resultArray = [];
            results.forEach(function(result) {
                resultArray.push({
                   snippet : result.snippet_text,
                   imgURL : result.snippet_image_url ? result.snippet_image_url : result.image_url,
                   ratingURL : result.rating_img_url
                });
            });
                
            // replace original array all at once for performance
            model.yelpResults(resultArray);
        },
        
        /**
         * Add new place into marker list, also serialize to local storage
         * @param {object} data, an item from search result list
         */
        addToFavorite : function(data) {
            model.markerList.push({
               title: data.title,
               position: data.position,
               vicinity: data.vicinity,
               place_id: data.place_id
            });
            localStorage.markerList = JSON.stringify(model.markerList());
        },
        
        /**
         * Remove favorite from marker list, also serialize to local storage
         * @param {object} data, an item from favorite marker list
         */
        removeFromFavorite : function(data) {
            model.markerList.remove(function(item) {
               return item.place_id == data.place_id; 
            });
            localStorage.markerList = JSON.stringify(model.markerList());
        },
        
        /**
         * Filter favorite list by search term
         * @param {string} term, term to be searched
         */
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

    /**
     * View object representing Google map area
     */
    var mapView = {
        /**
         * Initialize the map view
         * @param {object} latlng, map center position
         * @param {Array[object]} markers, The favorite place array
         * @param {Function(google.maps.Marker)} event handler when marker is clicked
         */    
        init : function(latlng, markers, clickHandler) {           
            // create map
            var mapOptions = {
                center : {
                    lat : latlng.lat,
                    lng : latlng.lng
                },
                zoom : 13
            };
            this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
            this.markerSet = {};
            this.searchResultMarkers = [];
            this.markerClicked = clickHandler;

            // add markers if any
            if (markers) {
                markers.forEach(function(m) {
                    this.markerSet[m.place_id] = this.makeMarker(m);
                }, this);
            }

            // create search box
            var searchInput = document.getElementById('map-searchbox');
            this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchInput);
        },

        /**
         * Re-center the map to new point
         * @param {object} latlng, the new center point
         */
        reCenter : function(latlng) {
            this.map.panTo(latlng);
        },
        
        /**
         * A marker maker
         * @param {object} data
         * @return {google.maps.Marker} the generated marker
         */
        makeMarker : function(data) {
            var view = this;
            var marker = new google.maps.Marker({
                position : data.position,
                map : this.map,
                title : data.title
            });
            
            // register handler when marker is clicked
            google.maps.event.addListener(marker, 'click', function() {
                if (view.lastClicked) {
                    view.lastClicked.setIcon(undefined);
                }
                marker.setIcon('blue_marker.png');
                view.lastClicked = marker;
                view.markerClicked(marker);
            });

            return marker;
        },
        
        /**
         * Hide all markers from the map.
         */
        hideMarkers : function() {
            for (var place_id in this.markerSet) {
                this.markerSet[place_id].setVisible(false);
            }
        },

        /**
         * Show markers on the map
         */
        showMarkers : function() {
            for (var place_id in this.markerSet) {
                this.markerSet[place_id].setVisible(true);
            }
        },

        /**
         * Sync markers with new marker list. This is the callback that knockout calls
         * when model's underlying marker list modified.
         * @param {Array[object]} markers, the new marker list
         */
        syncMarkers : function(markers) {
            var newSet = {};
            var markerSet = this.markerSet;

            // Add marker to marker set if not already presented
            markers.forEach(function(marker) {
                if (!(marker.place_id in markerSet)) {
                    markerSet[marker.place_id] = this.makeMarker(marker);
                }
                newSet[marker.place_id] = 1;    // cache all the new place_id into a set
            }, this);                           // for quicker lookup when doing removal
            
            // Remove marker from set if it's being deleted
            for (var place_id in markerSet) {
                if (!(place_id in newSet)) {
                    markerSet[place_id].setMap(null);
                    delete markerSet[place_id];
                }
            }
        },
        
        /**
         * Show new set of markers based on search results
         * @param {Array[object]} results, response from Google Place library
         */
        showSearchResultMarkers : function(results) {         
            // hide favorite place markers first
            this.hideMarkers();

            // clear old search results
            this.hideSearchResultMarkers();
            this.searchResultMarkers = [];

            // add new result markers
            results.forEach(function(result) {
                this.searchResultMarkers.push(this.makeMarker(result));
            }, this);
        },
        
        /**
         * Hide search result markers
         */
        hideSearchResultMarkers : function() {
            this.searchResultMarkers.forEach(function(marker) {
                marker.setMap(null);
            });
        },
        
        /**
         *  shrink map size; got called when right panel is visible
         */
        shrinkMap : function() {
            $('#map-container').removeClass('col-sm-9').addClass('col-sm-6');
        },
        
        /**
         * Expand map size; got called when right panel is hidden
         */
        expandMap : function() {
            $('#map-container').removeClass('col-sm-6').addClass('col-sm-9');
        }
    };

    /**
     * View object representing search result from left panel
     */
    var leftPanelView = {
        /**
         * Show search result section
         */    
        showSearchResult : function() {
            $('#search-results').removeClass('hidden');
        },
        
        /**
         * Hide search result section
         */
        hideSearchResult : function() {
            $('#search-results').addClass('hidden');
        }
    };
    
    /**
     * View object representing Yelp Review on right panel
     */
    var rightPanelView = {
        /**
         * open the right panel
         */
        open: function() {
            $('#right-panel').removeClass('hidden');
        },
        
        /**
         * close the right panel
         */
        close: function() {
            $('#right-panel').addClass('hidden');
        }
    };
    
    /**
     * ViewModel object that controls application behavior
     */
    var ViewModel = function() {
        var self = this;
        
        // Function Definition 
        /**
         * Add new place into marker list
         * @param {object} data, an item from search result list
         */
        self.addFavorite = function(data) {
            model.addToFavorite(data);
        };

        /**
         * Remove favorite from marker list
         * @param {object} data, an item from favorite marker list
         */
        self.removeFavorite = function(data) {
            model.removeFromFavorite(data);
        };
        
        /**
         * Re-center the map based on the item clicked
         * @param {object} data, clicked item from either favorite/search list
         */
        self.centerThis = function(data) {
            mapView.reCenter(data.position);
        };
        
        /**
         * Search nearby using Google places library. Invoked by knockout change event binding.
         * @param {ViewMode}, vm, the view model object.
         * @param {Event} the event object
         */
        self.search = function(vm, event) {
            var $input = $(event.target);
            var map = mapView.map;
            var request = {
                bounds : map.getBounds(),
                keyword : $input.val()
            };
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, vm.displaySearchResult);
        };

        /**
         * Display search results. Callback by Google place library nearby search.
         * @param {object} results, response from Google place library
         * @param {string} status, the response status code
         */
        self.displaySearchResult = function(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                model.populateSearchResults(results);
                mapView.showSearchResultMarkers(model.searchResults());
                leftPanelView.showSearchResult();
                self.searchError(false);
            } else {
                self.searchError(true);
            }
        };
        
        /**
         * Hide the search result section from the view. Also restore the original 
         * favorite place markers on the map.
         */
        self.hideSearchResult = function() {
            leftPanelView.hideSearchResult();
            mapView.hideSearchResultMarkers();
            self.searchTerm('');
            mapView.showMarkers();
        };
        
        /**
         * Hide the Yelp Review section from the view. Adjust map size accordingly.
         */
        self.hideYelpResult = function() {
            rightPanelView.close();
            mapView.expandMap();
        };
        
        /** 
         * Event handler when list item from favorites or search results is clicked
         * @param {Object} data, list item being clicked, passed from ko
         */
        self.itemClicked = function(data) {
            self.yelpSearchTerm(data.title);
            mapView.shrinkMap();
            rightPanelView.open();
            self.centerThis(data);
            self.searchYelp(data);
        };
        
        /**
         * Event handler when a map marker is clicked.
         * @param {google.maps.Marker} marker
         */
        self.markerClicked = function(marker) {
            var position = marker.getPosition();
            self.itemClicked({
                title: marker.getTitle(),
                position: {lat: position.lat(), lng: position.lng()}
            });
        };
        
        /**
         * Search from Yelp review API
         * @param {Object} data, list item being clicked
         */
        self.searchYelp = function(data) {
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
                        //location: data.vicinity,
                        ll: data.position.lat + ',' + data.position.lng,
                        limit: 5,
                        callback: 'cb'  // important! ensure correct oauth signature generation
                    }
                };

            var token = {
                public: 'Z3n8YsiXufXKyX6o3m5A_PHLF0iliBtu',
                secret: 'soKNxFDmBaeciFI_XGQuMaD7sQg'
            };
            
            // set up error handling timeout if Yelp search doesn't completed in 2 seconds
            // use this trick b/c $ajax.fail() won't be called because of jsonp
            var handleError = setTimeout(function() {
                self.yelpError(true);
            }, 2000);
            
            // Send the request  
            $.ajax({
                url: request_data.url,
                type: request_data.method,
                dataType: 'jsonp',
                jsonpCallback: 'cb',    // important! ensure correct oauth signature generation
                cache: true,            // important! ensure correct oauth signature generation
                data: oauth.authorize(request_data, token)
            })
            .done(function(response) {
                // clear error timeout
                clearTimeout(handleError);
                
                // populate model with results
                model.populateYelpResults(response.businesses);
                
                self.yelpError(false);
            });
        };
        
        // Initialize model and view
        model.init();
        mapView.init(model.initCord, model.markerList(), self.markerClicked);

        // properties related to map markers
        self.markerList = model.markerList;   
        // wire up map markers in sync with model's markerList observable array
        self.markerList.subscribe(mapView.syncMarkers, mapView);
        
        // properties related to search and filter
        self.searchResults = model.searchResults;
        self.searchTerm = ko.observable();
        self.searchError = ko.observable(false);
        self.filterTerm = ko.observable();
        // filter favorite list when filterTerm changes
        self.filterTerm.subscribe(function() {
            var term = self.filterTerm();
            model.filterFavorite(term);
        });
        
        // properties related to yelp review
        self.yelpResults = model.yelpResults;
        self.yelpSearchTerm = ko.observable();
        self.yelpError = ko.observable(false);
    };

    // start the application!!
    ko.applyBindings(new ViewModel());

});

