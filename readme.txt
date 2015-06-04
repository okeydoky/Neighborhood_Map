Neighborhood Map Application

Features:
1. Search Nearby Business
   Type in the search box on the map.
2. Add/Remove Favorite Place
   Hover over any list item, a add/remove icon will appear to the right.
   Markers on the map will automatically reflect the changes.
3. Search Yelp Review
   Click on any list item and markers on the map, Yelp review will show up on right panel.
4. Filter
   Type in the filter input box, the favorite list will reflect the change as you type.
   Markers on the map will also update accordingly.
5. Responsive Layout
   Layout will adjust automatically based on viewport size.

Example running the application:
1. Open neighborhood.html; Some default places should be loaded.
2. Click any list tiem or markers; It will bring up some Yelp reviews.
3. Use input box on the map to search nearby business. For example, sushi, italian..
   The search result will show up on left panel. The markers on the map are also updated.
4. Click on search result or marker will bring up Yelp review too.
5. Add new favorite place by hovering over search result. Click the (+) sign on the list.
   A new place is now added to the favorite list.
6. Click the close icon to close the search section. The updated favorite list and markers
   are brought back on the maps.
7. Hover over favorite list item; Click the (-) sign to remove item from the list.
   The markers on the map are also updated.
8. Close the Yelp Review section. The map size is auto adjusted to fill the space.

Implementation Notes:
1. Use Google Place library for nearby business search.
2. Use oauth-1.0a library to handle OAuth authentication required by Yelp API.
   See: https://github.com/ddo/oauth-1.0a
3. Use jQuery for DOM manipulation.
4. Use bootstrap CSS framework for responsive layout and look-and-feel.
5. Use knockout.js for View-Model architecture.
6. Use local storage for data persistency.