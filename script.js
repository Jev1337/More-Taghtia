/*global $*/
/*global L
$.getScript("env.js", function() {
    console.log("environment variables loaded.");
    populateMap();
});
*/
/*
 * Initialize Map
 */

L.mapbox.accessToken = 'pk.eyJ1IjoibWF0aWtpbjkiLCJhIjoiYjMyMjBjZTE4NWUxMDkxOWZjZjFjZWEzZTcxNDUxOTkifQ._ldFl3e17jCs7aWm6zMZ3Q';
var mymap = L.map('map-display').setView([36.804914, 10.182365], 9);
L.mapbox.styleLayer('mapbox://styles/mapbox/streets-v12').addTo(mymap);

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
    localStorage.removeItem('history');
    location.reload();
}