/*global $*/
/*global L
$.getScript("env.js", function() {
    console.log("environment variables loaded.");
    populateMap();
});
*/
/*
 * Initialize Map and Heatmap
 */

L.mapbox.accessToken = 'pk.eyJ1IjoibWF0aWtpbjkiLCJhIjoiYjMyMjBjZTE4NWUxMDkxOWZjZjFjZWEzZTcxNDUxOTkifQ._ldFl3e17jCs7aWm6zMZ3Q';
var mymap = L.map('map-display').setView([36.804914, 10.182365], 9);
L.mapbox.styleLayer('mapbox://styles/mapbox/streets-v12').addTo(mymap);

// Heatmap variables
var gponHeatmapData = [];
var vdslHeatmapData = [];
var adslHeatmapData = [];
var gponHeatmapLayer = null;
var vdslHeatmapLayer = null;
var adslHeatmapLayer = null;
var heatmapVisible = false;

// Batch check variables
var batchMode = false;
var batchQueue = [];
var batchMarkers = [];
var batchProcessing = false;
var batchSelectionActive = false; // Additional tracking variable

// Initialize heatmap layers
function initializeHeatmaps() {
    // Remove existing layers
    if (gponHeatmapLayer) {
        mymap.removeLayer(gponHeatmapLayer);
    }
    if (vdslHeatmapLayer) {
        mymap.removeLayer(vdslHeatmapLayer);
    }
    if (adslHeatmapLayer) {
        mymap.removeLayer(adslHeatmapLayer);
    }
    
    // GPON Fiber heatmap (Blue to Green gradient)
    if (gponHeatmapData.length > 0) {
        gponHeatmapLayer = L.heatLayer(gponHeatmapData, {
            radius: 35,
            blur: 25,
            maxZoom: 18,
            max: 1.0,
            gradient: {
                0.0: '#000080',    // Dark blue
                0.3: '#0066CC',    // Medium blue
                0.5: '#00CCFF',    // Light blue/cyan
                0.7: '#00FF66',    // Green
                0.9: '#00CC00',    // Dark green
                1.0: '#006600'     // Very dark green
            },
            minOpacity: 0.6
        });
    }
    
    // VDSL heatmap (Orange gradient)
    if (vdslHeatmapData.length > 0) {
        vdslHeatmapLayer = L.heatLayer(vdslHeatmapData, {
            radius: 30,
            blur: 20,
            maxZoom: 18,
            max: 1.0,
            gradient: {
                0.0: '#FF8C00',    // Dark orange
                0.3: '#FF9500',    // Medium orange
                0.5: '#FFA500',    // Orange
                0.7: '#FFB347',    // Light orange
                0.9: '#FFCC80',    // Very light orange
                1.0: '#FFD700'     // Gold
            },
            minOpacity: 0.5
        });
    }
    
    // ADSL heatmap (Red gradient)
    if (adslHeatmapData.length > 0) {
        adslHeatmapLayer = L.heatLayer(adslHeatmapData, {
            radius: 25,
            blur: 15,
            maxZoom: 18,
            max: 1.0,
            gradient: {
                0.0: '#8B0000',    // Dark red
                0.3: '#CC0000',    // Medium red
                0.5: '#FF0000',    // Red
                0.7: '#FF3333',    // Light red
                0.9: '#FF6666',    // Very light red
                1.0: '#FF9999'     // Pink-red
            },
            minOpacity: 0.4
        });
    }
    
    // Add layers to map if heatmap is visible
    if (heatmapVisible) {
        if (adslHeatmapLayer) adslHeatmapLayer.addTo(mymap);
        if (vdslHeatmapLayer) vdslHeatmapLayer.addTo(mymap);
        if (gponHeatmapLayer) gponHeatmapLayer.addTo(mymap);
    }
}

// Toggle heatmap visibility
function toggleHeatmap() {
    var totalLocations = gponHeatmapData.length + vdslHeatmapData.length + adslHeatmapData.length;
    
    if (totalLocations === 0) {
        return;
    }
    
    if (!gponHeatmapLayer && !vdslHeatmapLayer && !adslHeatmapLayer && totalLocations > 0) {
        initializeHeatmaps();
    }
    
    if (heatmapVisible) {
        // Hide all heatmaps
        if (gponHeatmapLayer) mymap.removeLayer(gponHeatmapLayer);
        if (vdslHeatmapLayer) mymap.removeLayer(vdslHeatmapLayer);
        if (adslHeatmapLayer) mymap.removeLayer(adslHeatmapLayer);
        heatmapVisible = false;
        document.getElementById("toggleHeatmap").innerHTML = '<i class="bi bi-thermometer-half" style="color: #00426b; font-size: 28px;"></i>';
    } else {
        // Show all heatmaps
        if (adslHeatmapLayer) adslHeatmapLayer.addTo(mymap);
        if (vdslHeatmapLayer) vdslHeatmapLayer.addTo(mymap);
        if (gponHeatmapLayer) gponHeatmapLayer.addTo(mymap);
        heatmapVisible = true;
        document.getElementById("toggleHeatmap").innerHTML = '<i class="bi bi-thermometer-sun" style="color: #ff4500; font-size: 28px;"></i>';
    }
}

// Add connection result to appropriate heatmap
function addToHeatmap(lat, lng, connectionType, intensity = 1.0) {
    var targetData = null;
    var connectionName = "";
    
    // Determine which heatmap to add to
    switch(connectionType) {
        case 'GPON':
            targetData = gponHeatmapData;
            connectionName = "GPON Fiber";
            break;
        case 'VDSL':
            targetData = vdslHeatmapData;
            connectionName = "VDSL";
            break;
        case 'ADSL':
            targetData = adslHeatmapData;
            connectionName = "ADSL";
            break;
        default:
            return; // Unknown connection type
    }
    
    // Check if this location is already in the heatmap data (avoid duplicates)
    // Using smaller threshold (0.0001 ≈ 11 meters) to allow nearby points with different connectivity
    var exists = targetData.some(function(point) {
        return Math.abs(point[0] - lat) < 0.0001 && Math.abs(point[1] - lng) < 0.0001;
    });
    
    if (!exists) {
        targetData.push([lat, lng, intensity]);
        initializeHeatmaps();
    }
}

function showMap(err,results) {
    if (err) {
      console.error(err);
      return;
    }
    if (results.latlng === undefined) {
        console.error("No results found.");
        return;
    }
      mymap.setView([results.latlng[0], results.latlng[1]], 13);
  }

  function zoomtocurrentlocation(){
    mymap.locate({setView: true, maxZoom: 16});
  }
function search() {
    var query = document.getElementById('address').value;
    var geocoder = L.mapbox.geocoder('mapbox.places');
    var options = {
        query: query,
        country: 'TN'
      };
    geocoder.query(options, showMap);
}

document.getElementById('address').addEventListener('keypress', function(e) {
    if (e.key === "Enter") {
        search();
    }
});

mymap.on('click', addMarker);

function addMarker(e){
  // Check if we're in batch mode
  console.log('Map clicked, batchMode:', batchMode, 'batchSelectionActive:', batchSelectionActive); // Debug log
  if (batchMode && batchSelectionActive) {
    console.log('Adding to batch queue:', e.latlng); // Debug log
    addToBatchQueue(e.latlng);
    return;
  }
  
  if (typeof circleMarker !== "undefined" ){ 
    mymap.removeLayer(circleMarker);    
    mymap.eachLayer(function (layer) {
        if (layer instanceof L.Tooltip) {
            mymap.removeLayer(layer);
        }
    });     
  }
  //add marker
  circleMarker = new  L.circle(e.latlng, 8, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5
            }).addTo(mymap);
    
}

const urlParams = new URLSearchParams(window.location.search);
const lati = urlParams.get('lat');
const lngi = urlParams.get('lng');
if (lati && lngi) {
    if (typeof circleMarker !== "undefined" ){ 
        mymap.removeLayer(circleMarker);    
        mymap.eachLayer(function (layer) {
            if (layer instanceof L.Tooltip) {
                mymap.removeLayer(layer);
            }
        });     
      }
    mymap.setView([lati, lngi], 17);
    circleMarker = new  L.circle([lati, lngi], 8, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5
    }).addTo(mymap);
    taghtia();
}
document.getElementById("googlemaps").onclick = function() {
    if (typeof circleMarker === "undefined" ){ 
        alert("Please select a location on the map");
        return;
    }
    lat = Math.round(circleMarker._latlng.lat * 10000) / 10000;
    lng = Math.round(circleMarker._latlng.lng * 10000) / 10000;
    window.open("https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng);
}
document.getElementById("copy").onclick = function() {
    if (typeof circleMarker === "undefined" ){ 
        alert("Please select a location on the map");
        return;
    }
    lat = Math.round(circleMarker._latlng.lat * 10000) / 10000;
    lng = Math.round(circleMarker._latlng.lng * 10000) / 10000;
    navigator.clipboard.writeText(lat + ", " + lng);
    document.getElementById("copied").innerHTML = lat + ", " + lng + " copied to clipboard!";
    var toastElList = [].slice.call(document.querySelectorAll('.toast'))
    var toastList = toastElList.map(function(toastEl) {
      return new bootstrap.Toast(toastEl)
    })
    toastList.forEach(toast => toast.show())
  }

  document.getElementById("share").onclick = function() {
    if (typeof circleMarker === "undefined" ){ 
        alert("Please select a location on the map");
        return;
    }
    lat = Math.round(circleMarker._latlng.lat * 10000) / 10000;
    lng = Math.round(circleMarker._latlng.lng * 10000) / 10000;
    shareurl = window.location.href;
    var parts = shareurl.split("?");
    shareurl = parts[0]+ "?lat=" + lat + "&lng=" + lng;;
    navigator.clipboard.writeText(shareurl);
    document.getElementById("copied").innerHTML = "Share URL copied to clipboard!";
    var toastElList = [].slice.call(document.querySelectorAll('.toast'))
    var toastList = toastElList.map(function(toastEl) {
      return new bootstrap.Toast(toastEl)
    })
    toastList.forEach(toast => toast.show())
  }




// Sample Code

/*
$.getJSON('../front/toptenv1.json', function(data) {
    $.each( data, function( key, val ) {
        var $popup = $("<div>", { 
        	"id": key
        });
        
        // Create element with restaurant info.
        $popup.append("<h1>" + val.title + "</h1>");
        $popup.append("<p>" + val.desc.substring(0, 100) + "..." + "</p>");
        
        var m = L.marker([val.lat, val.lng])
            	 .bindPopup($popup[0])
            	 .addTo(mymap);
    });
});
*/

document.getElementById("xycord").onclick = function() {
    

    var coordinateModal = new bootstrap.Modal(document.getElementById('coordinateModal'), {
        keyboard: false
    });

    coordinateModal.show();

    document.getElementById('saveCoordinates').onclick = function() {
        lt = document.getElementById("lat").value;
        lg = document.getElementById("lng").value;
        if (lt == "" || lg == "") {
            alert("Please enter valid coordinates");
            return;
        }
        coordinateModal.hide();
        if (typeof circleMarker !== "undefined" ){ 
            mymap.removeLayer(circleMarker);    
            mymap.eachLayer(function (layer) {
                if (layer instanceof L.Tooltip) {
                    mymap.removeLayer(layer);
                }
            });     
          }
        mymap.setView([lt, lg], 17);
        circleMarker = new L.circle([lt, lg], 8, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5
        }).addTo(mymap);
        taghtia();
    }
    
}

function populateMap() {
    $.getJSON("https://spreadsheets.google.com/feeds/list/" + SHEET_ID + "/1/public/values?alt=json", function(sheet) {
        var data = sheet.feed.entry;

        $.each( data, function(key, val) {
            var $popup = $("<div>", {
                "id": key
            });
            $popup.append("<p>" + val.gsx$incidenttype.$t + "<br>" + val.gsx$approxlatitude.$t + ", " + val.gsx$approxlongitude.$t + "</p>");
            
            var m = L.marker([val.gsx$approxlatitude.$t, val.gsx$approxlongitude.$t])
                .bindPopup($popup[0])
                .addTo(mymap);
        });
    });
}

// Hide/show panel function for desktop view. The panel is shown by default. 
var showPanel = true;
var collapsePanel = function(){
	if(showPanel === true){
	  $('div#panel').css('width','35px');
	  $('div#panelContent').css('opacity','0' );
	  $('div#collapseBtn button').text('>');
	  showPanel =! showPanel;
	  }
   else{
	  $('div#panel').css('width','300px');
	  $('div#panelContent').css('opacity','1');
	  $('div#collapseBtn button').text('<');
	  showPanel =! showPanel;
	  }
}

// Hide/show panel function for mobile view. The panel is not shown by default.
var showPanelXs = false;
var collapsePanelXs = function(){
	if(showPanelXs === true){
	  $('div#panel').css('width','0px');
	  $('div#panelContent').css('opacity','0' );
	  showPanelXs =! showPanelXs;
	  }
   else{
     $('div#panel').css('width','calc(100% - 45px)');
     $('div#panelContent').css('opacity','1');
     $('div#navbar').removeClass('in')
	  showPanelXs =! showPanelXs;
	  }
}
function  makeRString(){
    var text = "";
    var possible = "ABCxyz0123456789";

    for (var i = 0; i < 10; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

async function getToken(){
    const response = await fetch("https://geo.tunisietelecom.tn/rsm/RSMService.svc/getAppVersion");
    const data = await response.json();
    const r = data.getAppVersionResult;
    var s="";
    var t_s;
    var t_c;
    var WS1 = r;
    //Extraction du timeUTC en String
    var WS2 = WS1.substring(10, WS1.length);
    //Le convertir en long
    t_s = parseInt(WS2);
    //Le decoder: on obtient la date du serveur
    t_s = t_s - 1334170131052;
    //generer le token
    t_c = t_s + 1225486587123;
    s = makeRString() + t_c + "";
    var atoken=s; //use this token to call getPlacesPersons or GetRoute
    return atoken;
}


function codeCoordinates(x,y){
    const Ax = 100000.0;
    const Ay = 100000.0;
    const Bx = 123456.0;
    const By = 654321.0;
    return({xCoded:(x*Ax) - Bx , yCoded:(y*Ay) - By});
}

async function taghtia(){
    if (typeof circleMarker === "undefined" ){ 
        alert("Please select a location on the map");
        return;
    }
    var token = await getToken();
    var coded = codeCoordinates(circleMarker._latlng.lng,circleMarker._latlng.lat);
    var X = coded.xCoded;
    var Y = coded.yCoded;
    var payload = {TaghtiaRequest: {token: token, X: X, Y: Y}};
    document.getElementById("taghtia").innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
    document.getElementById("taghtia").disabled = true;
    var response = await fetch("https://geo.tunisietelecom.tn/rsm/RSMService.svc/TaghtiaUltimate", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    var stat="";
    var data = await response.json();
    document.getElementById("taghtia").innerHTML = 'Check Coverage';
    document.getElementById("taghtia").disabled = false;
    var result = data.TaghtiaUltimateResult;
    if (result.taghtia2G.Code_taghtia == 200 && result.taghtia2G.Taghtia == "OUI") {
        document.getElementById("2G").innerHTML = "Available";
        document.getElementById("2G").style.color = "green";
        circleMarker.setStyle({color: 'green', fillColor: 'green'});
    }else{
        document.getElementById("2G").innerHTML = "N/A";
        document.getElementById("2G").style.color = "red";
    }
    if (result.taghtia3G.Code_taghtia == 200 && result.taghtia3G.Taghtia == "OUI") {
        document.getElementById("3G").innerHTML = "Available";
        document.getElementById("3G").style.color = "green";
        circleMarker.setStyle({color: 'green', fillColor: 'green'});
    }else{
        document.getElementById("3G").innerHTML = "N/A";
        document.getElementById("3G").style.color = "red";
    }
    if (result.taghtia4G.Code_taghtia == 200 && result.taghtia4G.Taghtia == "OUI") {
        document.getElementById("4G").innerHTML = "Available";
        document.getElementById("4G").style.color = "green";
        circleMarker.setStyle({color: 'green', fillColor: 'green'});
    }else{
        document.getElementById("4G").innerHTML = "N/A";
        document.getElementById("4G").style.color = "red";
    }
    if (result.taghtiaADSLVDSL.taghtiaADSL.Code_taghtia == 200 && result.taghtiaADSLVDSL.taghtiaADSL.Taghtia == "OUI") {
        result.taghtiaADSLVDSL.taghtiaADSL.Debit += " <i class='bi bi-download'></i> 1Mb/s <i class='bi bi-upload'></i> ";
        document.getElementById("ADSL").innerHTML = result.taghtiaADSLVDSL.taghtiaADSL.Debit;
        document.getElementById("ADSL").style.color = "green";
        circleMarker.setStyle({color: 'green', fillColor: 'green'});
        stat+="ADSL ✅<br>"
        
        // Add to ADSL heatmap
        addToHeatmap(circleMarker._latlng.lat, circleMarker._latlng.lng, 'ADSL', 1.0);
    }else{
        document.getElementById("ADSL").innerHTML = "N/A";
        document.getElementById("ADSL").style.color = "red";
        stat+="ADSL ❌<br>"
    }
    if (result.taghtiaADSLVDSL.taghtiaVDSL.Code_taghtia == 200 && result.taghtiaADSLVDSL.taghtiaVDSL.Taghtia == "OUI") {
        result.taghtiaADSLVDSL.taghtiaVDSL.Debit = result.taghtiaADSLVDSL.taghtiaVDSL.Debit.replace("Down/", "Down");
        result.taghtiaADSLVDSL.taghtiaVDSL.Debit = result.taghtiaADSLVDSL.taghtiaVDSL.Debit.replace("Down", "<i class='bi bi-download'></i>");
        result.taghtiaADSLVDSL.taghtiaVDSL.Debit = result.taghtiaADSLVDSL.taghtiaVDSL.Debit.replace("Up", "<i class='bi bi-upload'></i>");
        document.getElementById("VDSL").innerHTML = result.taghtiaADSLVDSL.taghtiaVDSL.Debit;
        document.getElementById("VDSL").style.color = "green";
        circleMarker.setStyle({color: 'green', fillColor: 'green'});
        stat+="VDSL ✅<br>"
        
        // Add to VDSL heatmap
        addToHeatmap(circleMarker._latlng.lat, circleMarker._latlng.lng, 'VDSL', 1.0);
        
    }else{
        document.getElementById("VDSL").innerHTML = "N/A";
        document.getElementById("VDSL").style.color = "red";
        stat+="VDSL ❌<br>"
    }
    if (result.taghtiaGPON.Code_taghtia == 200 && result.taghtiaGPON.Message_taghtia == "OK" && result.taghtiaGPON.Taghtia == "OUI") {
        result.taghtiaGPON.Debit = result.taghtiaGPON.Debit.replace("Down/", "Down");
        result.taghtiaGPON.Debit = result.taghtiaGPON.Debit.replace("Down", "<i class='bi bi-download'></i>");
        result.taghtiaGPON.Debit = result.taghtiaGPON.Debit.replace("Up", "<i class='bi bi-upload'></i>");
        document.getElementById("GPONFiber").innerHTML = result.taghtiaGPON.Debit;
        document.getElementById("GPONFiber").style.color = "green";
        circleMarker.setStyle({color: 'green', fillColor: 'green'});
        stat+="GPON Fiber ✅"
        
        // Add to heatmap when GPON is available
        addToHeatmap(circleMarker._latlng.lat, circleMarker._latlng.lng, 'GPON', 1.0);
    }else{
        document.getElementById("GPONFiber").innerHTML = "N/A";
        document.getElementById("GPONFiber").style.color = "red";
        stat+="GPON Fiber ❌"
    }
    if (result.taghtiaFibreP2P.Code_taghtia == 200) {
        document.getElementById("P2PFiber").innerHTML = "Available";
        document.getElementById("P2PFiber").style.color = "green";
        circleMarker.setStyle({color: 'green', fillColor: 'green'});
    } else{
        document.getElementById("P2PFiber").innerHTML = "N/A";
        document.getElementById("P2PFiber").style.color = "red";
    }

    if (result.NearByPC.count > 0) {
        document.getElementById("more").innerHTML = "<h4>More Information:</h4>";
        document.getElementById("more").innerHTML += "<table width='100%' id='moreinfo'><tr><td>Designation:</td><td>" + result.NearByPC.pclist[0].designation + "</td></tr><tr><td>Distance:</td><td>" + result.NearByPC.pclist[0].distance + "</td></tr><tr><td>Nom RGMSAN:</td><td>" + result.NearByPC.pclist[0].nom_rgmsan + "</td></tr><tr><td>Nom SR:</td><td>" + result.NearByPC.pclist[0].nom_sr + "</td></tr></table>"
        document.getElementById("more").innerHTML += "<hr>";
    }else
        document.getElementById("more").innerHTML = "";
    
    circleMarker.bindTooltip(stat, {permanent: true, className: 'stats'});
    var history = JSON.parse(localStorage.getItem('history')) || [];
    var newEntry = { lat: circleMarker._latlng.lat, lng: circleMarker._latlng.lng };
    history.push(newEntry);
    localStorage.setItem('history', JSON.stringify(history));
}

document.getElementById("history").onclick = function() {
    var historyModal = new bootstrap.Modal(document.getElementById('historyModal'), {
        keyboard: false
    });

    historyModal.show();

    var historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    var history = JSON.parse(localStorage.getItem('history')) || [];

    history.forEach(function(entry, index) {
        var listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        var lat = Math.round(entry.lat * 10000) / 10000;
        var lng = Math.round(entry.lng * 10000) / 10000;
        listItem.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
        
        var goToButton = document.createElement('button');
        goToButton.className = 'btn btn-primary btn-sm';
        goToButton.innerHTML = '<i class="bi bi-geo-alt"></i> Go';
        
        goToButton.onclick = function() {
            if (typeof circleMarker !== "undefined" ){ 
                mymap.removeLayer(circleMarker);    
                mymap.eachLayer(function (layer) {
                    if (layer instanceof L.Tooltip) {
                        mymap.removeLayer(layer);
                    }
                });     
              }
            mymap.setView([entry.lat, entry.lng], 17);
            circleMarker = new L.circle([entry.lat, entry.lng], 8, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5
            }).addTo(mymap);
            historyModal.hide();
            taghtia();
        };
        
        listItem.appendChild(goToButton);
        historyList.appendChild(listItem);
    });
}

document.getElementById("fav").onclick = function() {
    //show favouritesModal
    var favourites = JSON.parse(localStorage.getItem('favourites')) || [];

    var favouritesList = document.getElementById('favouritesList');
    favouritesList.innerHTML = '';

    favourites.forEach(function(entry, index) {
        var listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        var lat = Math.round(entry.lat * 10000) / 10000;
        var lng = Math.round(entry.lng * 10000) / 10000;
        listItem.innerHTML = `Lat: ${lat}, Lng: ${lng}`;
        
        var buttonGroup = document.createElement('div');
        buttonGroup.className = 'btn-group';

        var goToButton = document.createElement('button');
        goToButton.className = 'btn btn-primary btn-sm';
        goToButton.innerHTML = '<i class="bi bi-geo-alt"></i> Go';
        goToButton.onclick = function() {
            if (typeof circleMarker !== "undefined" ){ 
            mymap.removeLayer(circleMarker);    
            mymap.eachLayer(function (layer) {
                if (layer instanceof L.Tooltip) {
                mymap.removeLayer(layer);
                }
            });     
              }
            mymap.setView([entry.lat, entry.lng], 17);
            circleMarker = new L.circle([entry.lat, entry.lng], 8, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5
            }).addTo(mymap);
            favouritesModal.hide();
            taghtia();
        };

        var deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';
        deleteButton.onclick = function() {
            favourites.splice(index, 1);
            localStorage.setItem('favourites', JSON.stringify(favourites));
            favouritesList.removeChild(listItem);
        };

        buttonGroup.appendChild(goToButton);
        buttonGroup.appendChild(deleteButton);
        listItem.appendChild(buttonGroup);

        favouritesList.appendChild(listItem);
    });

    document.getElementById('addFavourite').onclick = function() {
        var lat = parseFloat(document.getElementById('favLat').value);
        var lng = parseFloat(document.getElementById('favLng').value);
        if (isNaN(lat) || isNaN(lng)) {
            alert("Please enter valid coordinates");
            return;
        }
        var newFavourite = { lat: lat, lng: lng };
        favourites.push(newFavourite);
        localStorage.setItem('favourites', JSON.stringify(favourites));
        favouritesModal.hide();
    };

    document.getElementById('addCurrentLocation').onclick = function() {
        if (typeof circleMarker === "undefined") {
            alert("Please select a location on the map");
            return;
        }
        var lat = circleMarker._latlng.lat;
        var lng = circleMarker._latlng.lng;
        var newFavourite = { lat: lat, lng: lng };
        favourites.push(newFavourite);
        localStorage.setItem('favourites', JSON.stringify(favourites));
        favouritesModal.hide();
    };
    var favouritesModal = new bootstrap.Modal(document.getElementById('favouritesModal'), {
        keyboard: false
    });
    favouritesModal.show();

}

document.getElementById("clearhistory").onclick = function() {
    // Clear both history and heatmap data
    localStorage.removeItem('history');
    
    // Clear all heatmap data
    gponHeatmapData = [];
    vdslHeatmapData = [];
    adslHeatmapData = [];
    
    // Remove all heatmap layers
    if (gponHeatmapLayer) {
        mymap.removeLayer(gponHeatmapLayer);
        gponHeatmapLayer = null;
    }
    if (vdslHeatmapLayer) {
        mymap.removeLayer(vdslHeatmapLayer);
        vdslHeatmapLayer = null;
    }
    if (adslHeatmapLayer) {
        mymap.removeLayer(adslHeatmapLayer);
        adslHeatmapLayer = null;
    }
    
    heatmapVisible = false;
    document.getElementById("toggleHeatmap").innerHTML = '<i class="bi bi-thermometer-half" style="color: #00426b; font-size: 28px;"></i>';
    
    // Reload after a short delay
    setTimeout(function() {
        location.reload();
    }, 1000);
}

document.getElementById("toggleHeatmap").onclick = function() {
    toggleHeatmap();
}

// Batch checking functionality
function toggleBatchMode() {
    // Show batch modal regardless of current state
    var batchModal = new bootstrap.Modal(document.getElementById('batchModal'), {
        keyboard: false,
        backdrop: 'static' // Prevent closing by clicking outside
    });
    batchModal.show();
    
    // Initialize batch modal event listeners only once
    if (!window.batchModalInitialized) {
        initializeBatchModal();
        window.batchModalInitialized = true;
        
        // Add hidden event listener only once
        document.getElementById('batchModal').addEventListener('hidden.bs.modal', function () {
            console.log('Modal actually hidden, checking if batch mode should be reset'); // Debug log
            // Only reset if batch selection is not active
            if (!batchSelectionActive) {
                console.log('Resetting batch mode because selection is not active'); // Debug log
                batchMode = false;
                batchSelectionActive = false;
                document.getElementById("toggleBatchMode").innerHTML = '<i class="bi bi-cursor-fill" style="color: #00426b; font-size: 28px;"></i>';
            } else {
                console.log('Keeping batch mode active because selection is in progress'); // Debug log
            }
        });
    }
}

function initializeBatchModal() {
    // Start batch selection
    document.getElementById('startBatchSelection').onclick = function() {
        console.log('Start batch selection clicked'); // Debug log
        batchMode = true;
        batchSelectionActive = true;
        console.log('batchMode set to:', batchMode, 'batchSelectionActive:', batchSelectionActive); // Debug log
        document.getElementById("toggleBatchMode").innerHTML = '<i class="bi bi-cursor-fill" style="color: #ff4500; font-size: 28px;"></i>';
        document.getElementById('startBatchSelection').style.display = 'none';
        document.getElementById('stopBatchSelection').style.display = 'inline-block';
        document.getElementById('batchSelectionAlert').style.display = 'block';
        updateBatchDisplay();
        
        // Close the modal after starting selection so user can click on map
        var modal = bootstrap.Modal.getInstance(document.getElementById('batchModal'));
        if (modal) {
            modal.hide();
        }
    };
    
    // Stop batch selection
    document.getElementById('stopBatchSelection').onclick = function() {
        console.log('Stop batch selection clicked'); // Debug log
        batchMode = false;
        batchSelectionActive = false;
        console.log('batchMode set to:', batchMode, 'batchSelectionActive:', batchSelectionActive); // Debug log
        document.getElementById("toggleBatchMode").innerHTML = '<i class="bi bi-cursor-fill" style="color: #00426b; font-size: 28px;"></i>';
        document.getElementById('startBatchSelection').style.display = 'inline-block';
        document.getElementById('stopBatchSelection').style.display = 'none';
        document.getElementById('batchSelectionAlert').style.display = 'none';
    };
    
    // Process batch
    document.getElementById('processBatch').onclick = function() {
        if (batchQueue.length > 0 && !batchProcessing) {
            processBatchQueue();
        }
    };
    
    // Clear batch
    document.getElementById('clearBatch').onclick = function() {
        clearBatchQueue();
    };
    
    // Handle the close button specifically - override Bootstrap's default behavior
    var closeButton = document.querySelector('#batchModal .btn-close');
    if (closeButton) {
        closeButton.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Custom close button clicked'); // Debug log
            
            // Reset batch mode
            batchMode = false;
            batchSelectionActive = false;
            document.getElementById("toggleBatchMode").innerHTML = '<i class="bi bi-cursor-fill" style="color: #00426b; font-size: 28px;"></i>';
            
            // Reset UI elements
            document.getElementById('startBatchSelection').style.display = 'inline-block';
            document.getElementById('stopBatchSelection').style.display = 'none';
            document.getElementById('batchSelectionAlert').style.display = 'none';
            
            // Manually close the modal
            var modal = bootstrap.Modal.getInstance(document.getElementById('batchModal'));
            if (modal) {
                modal.hide();
            }
        };
    }
    
    updateBatchDisplay();
}

function addToBatchQueue(latlng) {
    console.log('addToBatchQueue called with:', latlng); // Debug log
    
    // Check if location already exists in queue
    var exists = batchQueue.some(function(item) {
        return Math.abs(item.lat - latlng.lat) < 0.0001 && Math.abs(item.lng - latlng.lng) < 0.0001;
    });
    
    console.log('Location exists in queue:', exists); // Debug log
    
    if (!exists) {
        var queueItem = {
            lat: latlng.lat,
            lng: latlng.lng,
            status: 'pending',
            id: 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };
        
        batchQueue.push(queueItem);
        console.log('Added to batch queue. New queue length:', batchQueue.length); // Debug log
        
        // Add visual marker
        var marker = L.circleMarker(latlng, {
            color: '#007bff',
            fillColor: '#007bff',
            fillOpacity: 0.7,
            radius: 6,
            weight: 2
        }).addTo(mymap);
        
        var lat = Math.round(latlng.lat * 10000) / 10000;
        var lng = Math.round(latlng.lng * 10000) / 10000;
        marker.bindTooltip('Batch #' + batchQueue.length + '<br>' + lat + ', ' + lng, {
            permanent: false,
            direction: 'top',
            className: 'batch-tooltip'
        });
        
        batchMarkers.push({marker: marker, id: queueItem.id});
        
        updateBatchDisplay();
    }
}

function updateBatchDisplay() {
    document.getElementById('batchCount').textContent = batchQueue.length;
    document.getElementById('queueCount').textContent = batchQueue.length;
    
    // Enable/disable process button
    document.getElementById('processBatch').disabled = batchQueue.length === 0 || batchProcessing;
    
    // Update queue display
    var queueDiv = document.getElementById('batchQueue');
    if (batchQueue.length === 0) {
        queueDiv.innerHTML = '<p class="text-muted text-center">No locations selected</p>';
    } else {
        var queueHtml = '';
        batchQueue.forEach(function(item, index) {
            var statusIcon = '';
            var statusClass = '';
            
            switch(item.status) {
                case 'pending':
                    statusIcon = '<i class="bi bi-clock text-warning"></i>';
                    statusClass = '';
                    break;
                case 'processing':
                    statusIcon = '<i class="bi bi-arrow-clockwise text-primary"></i>';
                    statusClass = 'table-active';
                    break;
                case 'completed':
                    statusIcon = '<i class="bi bi-check-circle-fill text-success"></i>';
                    statusClass = 'table-success';
                    break;
                case 'error':
                    statusIcon = '<i class="bi bi-x-circle-fill text-danger"></i>';
                    statusClass = 'table-danger';
                    break;
            }
            
            var lat = Math.round(item.lat * 10000) / 10000;
            var lng = Math.round(item.lng * 10000) / 10000;
            
            queueHtml += '<div class="d-flex justify-content-between align-items-center p-2 mb-1 border rounded ' + statusClass + '">';
            queueHtml += '<small>' + (index + 1) + '. ' + lat + ', ' + lng + '</small>';
            queueHtml += statusIcon;
            queueHtml += '</div>';
        });
        queueDiv.innerHTML = queueHtml;
    }
}

function clearBatchQueue() {
    batchQueue = [];
    clearBatchMarkers();
    updateBatchDisplay();
    document.getElementById('batchProgress').style.display = 'none';
    document.getElementById('batchStatus').textContent = '';
}

function clearBatchMarkers() {
    batchMarkers.forEach(function(item) {
        mymap.removeLayer(item.marker);
    });
    batchMarkers = [];
}

async function processBatchQueue() {
    if (batchProcessing || batchQueue.length === 0) return;
    
    batchProcessing = true;
    document.getElementById('processBatch').disabled = true;
    document.getElementById('batchProgress').style.display = 'block';
    
    var totalItems = batchQueue.length;
    var completedItems = 0;
    var batchSize = 5; // Process 5 locations at a time
    
    document.getElementById('batchStatus').textContent = 'Processing ' + totalItems + ' locations in batches of ' + batchSize + '...';
    document.getElementById('batchProgressBar').style.width = '0%';
    document.getElementById('batchProgressBar').textContent = '0%';
    
    // Process items in chunks of 5
    for (var i = 0; i < batchQueue.length; i += batchSize) {
        var chunk = batchQueue.slice(i, i + batchSize);
        var chunkNumber = Math.floor(i / batchSize) + 1;
        var totalChunks = Math.ceil(batchQueue.length / batchSize);
        
        // Set current chunk items to processing status
        chunk.forEach(function(item) {
            item.status = 'processing';
        });
        updateBatchDisplay();
        
        document.getElementById('batchStatus').textContent = 'Processing batch ' + chunkNumber + ' of ' + totalChunks + ' (' + chunk.length + ' locations)...';
        
        // Create promises for current chunk
        var chunkPromises = chunk.map(function(item) {
            return processBatchItem(item).then(function(result) {
                item.status = 'completed';
                completedItems++;
                
                // Update progress
                var progress = Math.round((completedItems / totalItems) * 100);
                document.getElementById('batchProgressBar').style.width = progress + '%';
                document.getElementById('batchProgressBar').textContent = progress + '%';
                
                updateBatchDisplay();
                return result;
            }).catch(function(error) {
                console.error('Error processing batch item:', error);
                item.status = 'error';
                completedItems++;
                
                // Update progress
                var progress = Math.round((completedItems / totalItems) * 100);
                document.getElementById('batchProgressBar').style.width = progress + '%';
                document.getElementById('batchProgressBar').textContent = progress + '%';
                
                updateBatchDisplay();
                return null;
            });
        });
        
        try {
            // Wait for current chunk to complete
            await Promise.all(chunkPromises);
        } catch (error) {
            console.error('Error in chunk processing:', error);
        }
        
        // Small delay between chunks to be gentle on the API
        if (i + batchSize < batchQueue.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Update batch markers to show completion status
    updateBatchMarkerStyles();
    
    batchProcessing = false;
    document.getElementById('processBatch').disabled = false;
    document.getElementById('batchStatus').textContent = 'All locations processed in batches! Check the heatmap for results.';
}

async function processBatchItem(item) {
    var token = await getToken();
    var coded = codeCoordinates(item.lng, item.lat);
    var X = coded.xCoded;
    var Y = coded.yCoded;
    var payload = {TaghtiaRequest: {token: token, X: X, Y: Y}};
    
    var response = await fetch("https://geo.tunisietelecom.tn/rsm/RSMService.svc/TaghtiaUltimate", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    
    var data = await response.json();
    var result = data.TaghtiaUltimateResult;
    
    // Process results and add to heatmaps
    if (result.taghtiaADSLVDSL.taghtiaADSL.Code_taghtia == 200 && result.taghtiaADSLVDSL.taghtiaADSL.Taghtia == "OUI") {
        addToHeatmap(item.lat, item.lng, 'ADSL', 1.0);
        item.adsl = true;
    }
    
    if (result.taghtiaADSLVDSL.taghtiaVDSL.Code_taghtia == 200 && result.taghtiaADSLVDSL.taghtiaVDSL.Taghtia == "OUI") {
        addToHeatmap(item.lat, item.lng, 'VDSL', 1.0);
        item.vdsl = true;
    }
    
    if (result.taghtiaGPON.Code_taghtia == 200 && result.taghtiaGPON.Message_taghtia == "OK" && result.taghtiaGPON.Taghtia == "OUI") {
        addToHeatmap(item.lat, item.lng, 'GPON', 1.0);
        item.gpon = true;
    }
    
    return item;
}

function updateBatchMarkerStyles() {
    batchMarkers.forEach(function(markerItem) {
        var queueItem = batchQueue.find(function(item) {
            return item.id === markerItem.id;
        });
        
        if (queueItem) {
            var color = '#6c757d'; // Default gray
            var tooltipContent = '';
            var tooltipClass = 'batch-tooltip';
            var lat = Math.round(queueItem.lat * 10000) / 10000;
            var lng = Math.round(queueItem.lng * 10000) / 10000;
            
            if (queueItem.status === 'completed') {
                var connections = [];
                if (queueItem.gpon) connections.push('GPON ✅');
                if (queueItem.vdsl) connections.push('VDSL ✅');
                if (queueItem.adsl) connections.push('ADSL ✅');
                
                if (connections.length === 0) {
                    connections.push('No connection ❌');
                    color = '#6c757d'; // Gray for no connection
                } else {
                    // Determine color based on best available connection
                    if (queueItem.gpon) {
                        color = '#28a745'; // Green for GPON
                    } else if (queueItem.vdsl) {
                        color = '#fd7e14'; // Orange for VDSL
                    } else if (queueItem.adsl) {
                        color = '#dc3545'; // Red for ADSL
                    }
                }
                
                tooltipContent = lat + ', ' + lng + '<br>' + connections.join('<br>');
                tooltipClass = 'connection-status';
            } else if (queueItem.status === 'error') {
                color = '#dc3545'; // Red for error
                tooltipContent = lat + ', ' + lng + '<br>Error checking connection';
                tooltipClass = 'connection-status';
            } else if (queueItem.status === 'processing') {
                color = '#007bff'; // Blue for processing
                tooltipContent = lat + ', ' + lng + '<br>Processing...';
            } else {
                tooltipContent = 'Batch #' + (batchQueue.indexOf(queueItem) + 1) + '<br>' + lat + ', ' + lng;
            }
            
            markerItem.marker.setStyle({
                color: color,
                fillColor: color,
                fillOpacity: 0.8
            });
            
            // Update tooltip with new content and class
            markerItem.marker.unbindTooltip();
            markerItem.marker.bindTooltip(tooltipContent, {
                permanent: false,
                direction: 'top',
                className: tooltipClass
            });
        }
    });
}

document.getElementById("toggleBatchMode").onclick = function() {
    toggleBatchMode();
}