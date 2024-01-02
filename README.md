# webmap-template
This is a template I created for myself as a starting point to build webmaps using data stored in a Google Sheet.  Uses OpenStreetMap, Leaflet, Mapbox, and Google Drive.

## Technology

*OpenStreetMap* - This is the base map.  Open source and closely tied to other open source mapping libraries and tools.

*Mapbox.js* - This library helps you build interactive maps.  

*jQuery* - I always like using jQuery for cleaner JavaScripting.

*Mapbox Studio* - Mapbox Studio is great and lets you create your own custom styled map tiles.

*Google Drive* - The data is stored in a Google Sheet where the first row is the column headers and the rest of the rows are the data.  This method works well if you don't need to join data from multiple tables/sources as in a relational database.

*Tabletop.js* - https://github.com/jsoma/tabletop


Areas to customize out of the box:
* Page title (index.html).
* Mapbox style used (script.js).
* Lat/Lng centering (script.js).
* Map area within page (style.css).

Resources:
* https://acrl.ala.org/techconnect/post/query-a-google-spreadsheet-like-a-database-with-google-visualization-api-query-language/
* https://developers.google.com/chart/interactive/docs/querylanguage

* https://bionicteaching.com/google-sheets-json-with-jquery/


Notes:

The Google Sheet ID is stored as an environment variable within env.js.  Rename env-sample.js to env.js for the code to work and to make sure git ignores your Sheet's ID for security purposes.  You can check for this after you make changes by running `git status` in the command line.  Why do you want to keep this info secure?  [You can end up with a very expensive lesson](https://www.quora.com/My-AWS-account-was-hacked-and-I-have-a-50-000-bill-how-can-I-reduce-the-amount-I-need-to-pay).

GitHub setup

https://help.github.com/articles/connecting-to-github-with-ssh/