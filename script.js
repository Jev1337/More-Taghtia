/*global $*/
/*global L*/
$.getScript("env.js", function() {
    console.log("environment variables loaded.");
    populateMap();
});

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
    console.log(results);
      mymap.setView([results.latlng[0], results.latlng[1]], 40);
  }

function search() {
    var query = document.getElementById('address').value;
    var geocoder = L.mapbox.geocoder('mapbox.places');
    //create an object containing the query: { query: query, proximity: L.latlng(36.804914, 10.182365) }
    var options = {
        query: query,
        country: 'TN' // Example: restrict results to a specific country
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
  }
  //add marker
  circleMarker = new  L.circle(e.latlng, 20, {
                color: 'red',
                fillColor: '#f03',
                fillOpacity: 0.5
            }).addTo(mymap);
    console.log(e.latlng)
    
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
    //POST request https://geo.tunisietelecom.tn/rsm/RSMService.svc/TaghtiaUltimate with the following Payload {TaghtiaRequest: {token: "", X: , Y: }}
    var coded = codeCoordinates(circleMarker._latlng.lng,circleMarker._latlng.lat);
    var X = coded.xCoded;
    var Y = coded.yCoded;
    var payload = {TaghtiaRequest: {token: token, X: X, Y: Y}};
    console.log(payload);
    document.getElementById("taghtia").innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
    document.getElementById("taghtia").disabled = true;
    var response = await fetch("https://geo.tunisietelecom.tn/rsm/RSMService.svc/TaghtiaUltimate", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    //change button to loading button animation (replace text by spinner of bootstrap) and disable it
    //button id is taghtia
    var data = await response.json();
    document.getElementById("taghtia").innerHTML = 'Taghtia';
    document.getElementById("taghtia").disabled = false;
    console.log(data);
    //once we get the response, we will use it to update table datas and show the results
    var result = data.TaghtiaUltimateResult;
    if (result.taghtia2G.Code_taghtia == 200 && result.taghtia2G.Taghtia == "OUI") {
        document.getElementById("2G").innerHTML = "Available";
        document.getElementById("2G").style.color = "green";
    }else{
        document.getElementById("2G").innerHTML = "N/A";
        document.getElementById("2G").style.color = "red";
    }
    if (result.taghtia3G.Code_taghtia == 200 && result.taghtia3G.Taghtia == "OUI") {
        document.getElementById("3G").innerHTML = "Available";
        document.getElementById("3G").style.color = "green";
    }else{
        document.getElementById("3G").innerHTML = "N/A";
        document.getElementById("3G").style.color = "red";
    }
    if (result.taghtia4G.Code_taghtia == 200 && result.taghtia4G.Taghtia == "OUI") {
        document.getElementById("4G").innerHTML = "Available";
        document.getElementById("4G").style.color = "green";
    }else{
        document.getElementById("4G").innerHTML = "N/A";
        document.getElementById("4G").style.color = "red";
    }
    if (result.taghtiaADSLVDSL.taghtiaADSL.Code_taghtia == 200 && result.taghtiaADSLVDSL.taghtiaADSL.Taghtia == "OUI") {
        result.taghtiaADSLVDSL.taghtiaADSL.Debit += " ↓ 1Mb/s ↑";
        document.getElementById("ADSL").innerHTML = result.taghtiaADSLVDSL.taghtiaADSL.Debit;
        document.getElementById("ADSL").style.color = "green";
    }else{
        document.getElementById("ADSL").innerHTML = "N/A";
        document.getElementById("ADSL").style.color = "red";
    }
    if (result.taghtiaADSLVDSL.taghtiaVDSL.Code_taghtia == 200 && result.taghtiaADSLVDSL.taghtiaVDSL.Taghtia == "OUI") {
        result.taghtiaADSLVDSL.taghtiaVDSL.Debit = result.taghtiaADSLVDSL.taghtiaVDSL.Debit.replace("Down/", "Down");
        result.taghtiaADSLVDSL.taghtiaVDSL.Debit = result.taghtiaADSLVDSL.taghtiaVDSL.Debit.replace("Down", "↓");
        result.taghtiaADSLVDSL.taghtiaVDSL.Debit = result.taghtiaADSLVDSL.taghtiaVDSL.Debit.replace("Up", "↑");
        document.getElementById("VDSL").innerHTML = result.taghtiaADSLVDSL.taghtiaVDSL.Debit;
        document.getElementById("VDSL").style.color = "green";
    }else{
        document.getElementById("VDSL").innerHTML = "N/A";
        document.getElementById("VDSL").style.color = "red";
    }
    if (result.taghtiaGPON.Code_taghtia == 200 && result.taghtiaGPON.Message_taghtia == "OK" && result.taghtiaGPON.Taghtia == "OUI") {
        result.taghtiaGPON.Debit = result.taghtiaGPON.Debit.replace("Down/", "Down");
        result.taghtiaGPON.Debit = result.taghtiaGPON.Debit.replace("Down", "↓");
        result.taghtiaGPON.Debit = result.taghtiaGPON.Debit.replace("Up", "↑");
        document.getElementById("GPONFiber").innerHTML = result.taghtiaGPON.Debit;
        document.getElementById("GPONFiber").style.color = "green";
    }else{
        document.getElementById("GPONFiber").innerHTML = "N/A";
        document.getElementById("GPONFiber").style.color = "red";
    }
    if (result.taghtiaFibreP2P.Code_taghtia == 200) {
        document.getElementById("P2PFiber").innerHTML = "Available";
        document.getElementById("P2PFiber").style.color = "green";
    } else{
        document.getElementById("P2PFiber").innerHTML = "N/A";
        document.getElementById("P2PFiber").style.color = "red";
    }

    if (result.NearByPC.count > 0) {
        document.getElementById("more").innerHTML = "<h4>More Information:</h4>";
        document.getElementById("more").innerHTML += "<table width='100%'><tr><td>Designation:</td><td>" + result.NearByPC.pclist[0].designation + "</td></tr><tr><td>Distance:</td><td>" + result.NearByPC.pclist[0].distance + "</td></tr><tr><td>Nom RGMSAN:</td><td>" + result.NearByPC.pclist[0].nom_rgmsan + "</td></tr><tr><td>Nom SR:</td><td>" + result.NearByPC.pclist[0].nom_sr + "</td></tr></table>"
        document.getElementById("more").innerHTML += "<hr>";
    }else
        document.getElementById("more").innerHTML = "";

    /*
    Response:
    {
    "TaghtiaUltimateResult": {
        "NearByPC": {
            "code": "1",
            "count": 1,
            "message": "OK",
            "pclist": [
                {
                    "designation": "D2\/14",
                    "distance": 16.228177610849833,
                    "guid": "{7E7E95CB-AE95-4D69-B22E-95B6B73118BA}",
                    "id_rgmsan": "{49C9AD00-D73A-400E-80CC-ED1315BAAAB9}",
                    "id_sr": "{FC50ED2A-D7CA-4550-92B4-29A06A09767C}",
                    "nom_rgmsan": "riadh_andalous",
                    "nom_sr": "sr3_riadh_andalous",
                    "pc_acap": 0,
                    "pc_acap_code": 0
                }
            ]
        },
        "code": "1",
        "date_etude": 1704212969,
        "hors_zone": 0,
        "hors_zone_taghtia": 0,
        "id_taghtia": "xzy11yz22z1704212964840",
        "message": "Taghtia Ultimate: OK",
        "source": "ULTIMATE",
        "taghtia2G": {
            "Classe": "0",
            "Code_taghtia": "0",
            "Debit": "",
            "Message_taghtia": "Erreur WS",
            "Nom": "",
            "Taghtia": "",
            "Type": "2G"
        },
        "taghtia3G": {
            "Classe": "0",
            "Code_taghtia": "0",
            "Debit": "",
            "Message_taghtia": "Erreur WS",
            "Nom": "",
            "Taghtia": "",
            "Type": "3G"
        },
        "taghtia4G": {
            "Classe": "0",
            "Code_taghtia": "0",
            "Debit": "",
            "Message_taghtia": "Erreur WS",
            "Nom": "",
            "Taghtia": "",
            "Type": "4G"
        },
        "taghtiaADSLVDSL": {
            "FADSL": 0,
            "FVDSL": 0,
            "taghtiaADSL": {
                "Classe": "",
                "Code_taghtia": "2",
                "Debit": "",
                "Message_taghtia": "No route from PC",
                "Nom": "",
                "Taghtia": "Information non disponible",
                "Type": "ADSL"
            },
            "taghtiaVDSL": {
                "Classe": "",
                "Code_taghtia": "2",
                "Debit": "",
                "Message_taghtia": "No route from PC",
                "Nom": "",
                "Taghtia": "Information non disponible",
                "Type": "VDSL"
            }
        },
        "taghtiaFibreP2P": {
            "Classe": "",
            "Code_taghtia": "0",
            "Debit": "",
            "Message_taghtia": "Erreur WS",
            "Nom": "",
            "Taghtia": "",
            "Type": "Fibre P2P"
        },
        "taghtiaGPON": {
            "Classe": "1",
            "Code_taghtia": "200",
            "Debit": "100Mb\/s Down\/ 16Mb\/s Up",
            "Message_taghtia": "OK",
            "Nom": "",
            "Taghtia": "OUI",
            "Type": "GPON"
        }
    }
}
    */

}