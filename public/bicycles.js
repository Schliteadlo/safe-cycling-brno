

$(document).ready(function() {
    
    mymap = L.map('mapid').setView([49.17523, 16.5645], 13);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibWlzb21rZSIsImEiOiJja2F6czNnMTAwMTRmMnJxamFhY3hiYnZyIn0.9w7pxiC9GskHgY1HiAfYBg'
    }).addTo(mymap);
    geojsonMarkerDeceased = {
        radius: 11,
        fillColor: "#fc1403",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    geojsonMarkerSeverely = {
        radius: 11,
        fillColor: "#fc8c03",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    geojsonMarkerLightly = {
        radius: 11,
        fillColor: "#e3fc03",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    getRequest('https://kola-nehody-data.s3.eu-de.cloud-object-storage.appdomain.cloud/koloNehody%20(2).geojson', addMarkers);
    new autoComplete(autoComp('#start'));

    new autoComplete(autoComp('#finish'));

    document.getElementById('submitButton').addEventListener('click', function() {
        var start =  document.getElementById('start').value;
        var end =  document.getElementById('finish').value;
        getRoute(start,end);
        
    });

})

var mymap;
var orsApi = '5b3ce3597851110001cf62488d7bb08d74d541c98b2faadb6961d474';
var jsonNehoody;
var avoidPolygons = [];
var startCoor = '';
var endCoor = '';
var fastRoute;
var safeRoute;
var streets;
var startMarker;
var destinationMarker;
var customRoute;



function autoComp(selector) {
    return {
            data: {                          
              src: async () => {
                return streets;
              },
              cache: false
            },
            sort: (a, b) => {                   
                if (a.match < b.match) return -1;
                if (a.match > b.match) return 1;
                return 0;
            },
            selector: selector,           
            threshold: 1,                 
            resultsList: {                
                render: true,
                container: source => {
                    source.setAttribute("id", "street_list");
                },
                destination: document.querySelector(selector),
                position: "afterend",
                element: "ul"
            },
            maxResults: 5,                       
            highlight: true,                     
            resultItem: {                        
                content: (data, source) => {
                    source.innerHTML = data.match;
                },
                element: "li"
            },
            noResults: () => {                    
                const result = document.createElement("li");
                result.setAttribute("class", "no_result");
                result.setAttribute("tabindex", "1");
                result.innerHTML = "No Results";
                document.querySelector("#street_list").appendChild(result);
            },
            onSelection: feedback => {            
               
                $(selector).val(feedback.selection.value);
            }
    }
}


   
 var startIcon = L.icon({
    iconUrl: 'https://api.iconify.design/bx:bxs-flag.svg?color=%2318ad51',
    
    iconSize:     [42, 42], // size of the icon
    
    iconAnchor:   [5, 42], // point of the icon which will correspond to marker's location
    
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
}); 

 var endIcon = L.icon({
    
        iconUrl: 'https://api.iconify.design/bx:bxs-flag.svg?color=%4538ad51',
    
        iconSize:     [42, 42], // size of the icon
    
        iconAnchor:   [5, 42], // point of the icon which will correspond to marker's location
    
        popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
	}); 
    
   

   var geojsonMarkerNoInjury = {
        radius: 11,
        fillColor: "#28fc03",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    var geojsonMarkerDeceased

    var geojsonMarkerSeverely

    var geojsonMarkerLightly 
    
    var fastRouteStyle = {
    "color": "#db5116",
    "weight": 5,
    "opacity": 0.9
    };

    var slowRouteStyle = {
    "color": "#007d08",
    "weight": 5,
    "opacity": 0.9
    };

    var customRouteStyle = {
    "color": "#0b66e6",
    "weight": 5,
    "opacity": 0.9
    };
    getRequest('https://kola-nehody-data.s3.eu-de.cloud-object-storage.appdomain.cloud/ulice.txt', 
        function(response) {
            var jsonObj = JSON.parse(response);
            streets = jsonObj.streets;
    });

    getRequest('https://kola-nehody-data.s3.eu-de.cloud-object-storage.appdomain.cloud/koloFINALFOREALNOW.geojson', 
        function(response) {
            jsonNehoody = JSON.parse(response);
    });

    function addMarkers(responseText) {
        var jsonObj = JSON.parse(responseText);
                L.geoJSON(jsonObj, {
                    pointToLayer: function (feature, latlng) {
                        if (feature.properties.Deceased > 0) {
                            var marker = L.circleMarker(latlng, geojsonMarkerDeceased);
						} else if (feature.properties.Severely > 0) {
                            var marker = L.circleMarker(latlng, geojsonMarkerSeverely);
						} else if (feature.properties.Lightly > 0) {
                            var marker = L.circleMarker(latlng, geojsonMarkerLightly);
						} else {
                            var marker = L.circleMarker(latlng, geojsonMarkerNoInjury);              
						}
                        marker.on('click',function(ev) {
                            if (ev.target.isPopupOpen()) {
                                 avoidPolygons.splice(avoidPolygons.indexOf(feature.geometry.coordinates[0]), 1);
                                 avoidPolygons.splice(avoidPolygons.indexOf(feature.geometry.coordinates[1]), 1);
                                 
                                 ev.target.closePopup();
                                 ev.target.unbindPopup();
							} else {
                                 
                                 avoidPolygons.push(feature.geometry.coordinates[0]);
                                 avoidPolygons.push(feature.geometry.coordinates[1]);
                                 ev.target.bindPopup('selected' , {closeOnClick: false, autoClose: false, closeButton: false});
                                 ev.target.openPopup();   
							}
                        });
                        return marker;        
				    },
                    onEachFeature: onEachFeatureAccidents
                }).addTo(mymap);
	}

    function onEachFeatureAccidents(feature, layer) {
        
        var tooltipContent = 'Deceased: ' + feature.properties.Deceased + '<br>Severely Injured: ' + feature.properties.Severely + '<br>Lightly Injured: ' + feature.properties.Lightly;
        

        layer.bindTooltip(tooltipContent);
	}

    function onEachFeatureDangerousRoute(feature, layer) {
        
        var tooltipContent = 'Distance: ' + feature.properties.summary.distance + 'm<br>Fastest route';
        

        layer.bindTooltip(tooltipContent);
	}

    function onEachFeatureCustomRoute(feature, layer) {
        
        var tooltipContent = 'Distance: ' + feature.properties.summary.distance + 'm<br>Custom route';
        

        layer.bindTooltip(tooltipContent);
	}

    function onEachFeatureSafeRoute(feature, layer) {
        
        var tooltipContent = 'Distance: ' + feature.properties.summary.distance + 'm<br>Safest route';
        

        layer.bindTooltip(tooltipContent);
	}
   
   function getRequest(link, successCallback) {
     
        var xhr = new XMLHttpRequest();
        
        xhr.open('GET', link);
        xhr.onload = function() {
        if (xhr.status == 200) {
           // obj.Icon = startIcon;
           
           successCallback(xhr.responseText);
             
		} else {
            console.log('rip');
            }
        }
       
        xhr.send();
    }

    function postRequest(routeType, successCallback) {
        
        let request = new XMLHttpRequest();
        
        request.open('POST', "https://api.openrouteservice.org/v2/directions/cycling-regular/geojson");

        request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('Authorization', orsApi);

        request.onload = function () {
         
          if (request.status == 200) {
            successCallback(request.responseText);
             
		} else {
            console.log('rip');
            }
        }

        var body;
        if (routeType == 'safe'){
            body = '{"coordinates":[' + startCoor + ',' + endCoor + '],"options":{"avoid_polygons":'+ JSON.stringify(jsonNehoody.features[0].geometry) + '}}';
		} else if (routeType == 'custom') {
            var avoidMultiPolygon = '{"type":"MultiPolygon","coordinates":[';
            var i;
            for (i = 0; i < avoidPolygons.length; i++) {
                    var polygonSize = 0.0001;
                    if (i + 2 >= avoidPolygons.length) {
                        avoidMultiPolygon += '[[[' + parseFloat(avoidPolygons[i] - polygonSize) + ',' + parseFloat(avoidPolygons[i+1] - polygonSize) + '],' + 
                                        '[' + parseFloat(avoidPolygons[i] + polygonSize) + ',' + parseFloat(avoidPolygons[i+1] - polygonSize) + '],' + 
                                        '[' + parseFloat(avoidPolygons[i] + polygonSize) + ',' + parseFloat(avoidPolygons[i+1] + polygonSize) + '],' +
                                        '[' + parseFloat(avoidPolygons[i] - polygonSize) + ',' + parseFloat(avoidPolygons[i+1] + polygonSize) + '],' +
                                        '[' + parseFloat(avoidPolygons[i] - polygonSize) + ',' + parseFloat(avoidPolygons[i+1] - polygonSize) + ']]]'
			        } else {
                        avoidMultiPolygon += '[[[' + parseFloat(avoidPolygons[i] - polygonSize) + ',' + parseFloat(avoidPolygons[i+1] - polygonSize) + '],' + 
                                        '[' + parseFloat(avoidPolygons[i] + polygonSize) + ',' + parseFloat(avoidPolygons[i+1] - polygonSize) + '],' + 
                                        '[' + parseFloat(avoidPolygons[i] + polygonSize) + ',' + parseFloat(avoidPolygons[i+1] + polygonSize) + '],' +
                                        '[' + parseFloat(avoidPolygons[i] - polygonSize) + ',' + parseFloat(avoidPolygons[i+1] + polygonSize) + '],' +
                                        '[' + parseFloat(avoidPolygons[i] - polygonSize) + ',' + parseFloat(avoidPolygons[i+1] - polygonSize) + ']]],'
			        }
                    i++;
			}
            avoidMultiPolygon += ']}'
            body = '{"coordinates":[' + startCoor + ',' + endCoor + '],"options":{"avoid_polygons":'+ avoidMultiPolygon + '}}';
		} else {
            body = '{"coordinates":[' + startCoor + ',' + endCoor + ']}}'; 
		}
        
        request.send(body);
    }
    

    
    function getRoute(start, end) {
       
        var addressBaseLink = 'http://open.mapquestapi.com/geocoding/v1/address?key=14x4dkmGCqu2XdZVJmpp7ffimBpDLdVw&location=';
        
        getRequest(addressBaseLink + start + ',Brno,CZ',
                   function(responseText) {
                   setPointIcon(responseText, {icon: startIcon, argument: '&start='});
                   getRequest(addressBaseLink + end + ',Brno,CZ', function(data) {
                        setPointIcon(data, {icon: endIcon, argument: '&end='});
                        postRequest('safe', function(route) {
                            var jsonObj = JSON.parse(route);
                           
                            if (typeof safeRoute !== 'undefined') {
                                safeRoute.remove();
							}
                            safeRoute =new L.geoJSON(jsonObj, {
                                style: slowRouteStyle,
                                onEachFeature: onEachFeatureSafeRoute
                            });
                            safeRoute.addTo(mymap);
                           

                        })
                        postRequest('fast', function(route) {
                            ;
                            var jsonObj = JSON.parse(route);
                           
                            if (typeof fastRoute !== 'undefined') {
                                fastRoute.remove();
							}
                            fastRoute =new L.geoJSON(jsonObj, {
                                style: fastRouteStyle,
                                onEachFeature: onEachFeatureDangerousRoute
                            });
                            fastRoute.addTo(mymap);

                        })

                        if (avoidPolygons.length > 0) {
                            postRequest('custom', function(route) {
                            var jsonObj = JSON.parse(route);
                            
                            if (typeof customRoute !== 'undefined') {
                                customRoute.remove();
							}
                            customRoute =new L.geoJSON(jsonObj, {
                                style: customRouteStyle,
                                onEachFeature: onEachFeatureCustomRoute
                            });
                            customRoute.addTo(mymap);
                            })
                        } else {
                            if (typeof customRoute !== 'undefined') {
                                customRoute.remove();
							}
						}
                        

                   });
                });
    }

    function setPointIcon(responseText, args){
        var jsonObj = JSON.parse(responseText);
        if (args.argument == '&start=') {
            if (typeof startMarker !== 'undefined') {
                mymap.removeLayer(startMarker)     
			}
            startMarker = L.marker([jsonObj.results[0].locations[0].displayLatLng.lat, jsonObj.results[0].locations[0].displayLatLng.lng], {icon: args.icon}).addTo(mymap);
            startCoor = '['+ jsonObj.results[0].locations[0].displayLatLng.lng +  ',' + jsonObj.results[0].locations[0].displayLatLng.lat + ']';
		} else {
            if (typeof destinationMarker !== 'undefined') {
                mymap.removeLayer(destinationMarker)     
			}
            destinationMarker = L.marker([jsonObj.results[0].locations[0].displayLatLng.lat, jsonObj.results[0].locations[0].displayLatLng.lng], {icon: args.icon}).addTo(mymap);
            endCoor = '['+ jsonObj.results[0].locations[0].displayLatLng.lng +  ',' + jsonObj.results[0].locations[0].displayLatLng.lat  + ']';
		}
       
        
	}
function hideRoutes() {
  // Get the checkbox
  var fastCheckBox = document.getElementById("safeRoute");
  var safeCheckBox = document.getElementById("fastRoute");
  var customCheckBox = document.getElementById("customRoute");

  if (fastCheckBox.checked == true){
    if (typeof fastRoute !== 'undefined') {
        fastRoute.addTo(mymap);
    }
     
  } else {
     if (typeof fastRoute !== 'undefined') {
        fastRoute.remove();
	 }
  }
  if (safeCheckBox.checked == true){
    if (typeof safeRoute !== 'undefined') {
        safeRoute.addTo(mymap);
	 }
  } else {
    if (typeof safeRoute !== 'undefined') {
        safeRoute.remove();
	 }
  }
  if (customCheckBox.checked == true){
    if (typeof customRoute !== 'undefined') {
        customRoute.addTo(mymap);
	 }
  } else {
    if (typeof customRoute !== 'undefined') {
        customRoute.remove();
	 }
  }
}
    

