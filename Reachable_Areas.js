$(document).ready(function () {
    
    // Please enter your API key here
    const api_key = "YOUR_API_KEY";

    var markers = [];
    var vehicleProfile =  "BICYCLE";
    var horizon1 = 500;
    var horizon2 = 1000;
    var horizonLayer1 = null;
    var horizonLayer2 = null;


    //Initialize map
    var startPosition = L.latLng(49.01084899902344, 8.403818130493164);

    var map = new L.Map('map', {
        center: startPosition,
        zoom: 15,
        zoomControl: false
    });

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);


    var tileLayer = new L.tileLayer(
        "https://api.myptv.com/rastermaps/v1/image-tiles/{z}/{x}/{y}?size={tileSize}",
        {
            attribution: "© " + new Date().getFullYear() + ", PTV Group, HERE",
            tileSize: 256,
            trackResize: false,
        },
        [
            { header: "ApiKey", value: api_key },
    ]).addTo(map);

    //Setting the initial start point on the map
    setMarker();


    // This function decorates the map by setting a marker at the reference position from which the reachable areas are calculated.
    function setMarker() {
        // The new marker is set.
        var marker = L.marker(startPosition).addTo(map);
        markers.push(marker);
    }

    //Adding click functionality to the map
    map.on('click', onMapClick);

    //reacting on map click event to remove markers and set an new startPositions
    function onMapClick(e) {        
            removeAllMarkers(map);
            startPosition = e.latlng;
            L.marker(startPosition).addTo(map);
            fetchRoute();
    }

    //removing existing marker of the startPosition from the map
    function removeAllMarkers(map) {
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                layer.remove();
            }
        });
    }

    //Adding map control elements
    addMapControls();


    function addMapControls() {
        const routingControl = L.control({ position: 'topleft' });
        routingControl.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'routing-control');
            const html = `
            <h2>Reachable Areas</h2>

            <div>
                <label for="vehicleProfile" style="display: block;">Vehicle Profile</label>
                <select name="vehicleProfile" id="vehicleProfile" style="display: block;">
                    <option value="BICYCLE">BICYCLE</option>
                    <option value="EUR_TRAILER_TRUCK">EUR_TRAILER_TRUCK</option>
                    <option value="EUR_TRUCK_40T">EUR_TRUCK_40T</option>
                    <option value="EUR_TRUCK_11_99T">EUR_TRUCK_11_99T</option>
                    <option value="EUR_TRUCK_7_49T">EUR_TRUCK_7_49T</option>
                    <option value="EUR_VAN">EUR_VAN</option>
                    <option value="EUR_CAR">EUR_CAR</option>       
                </select>
            </div>
            <div id="slider">
                <p>Horizon 1:</p>
                <div id="title_horizon1" style="font-size:x-small"> Set distance value (max. 25000m)</div>
                     <label for="horizon1" id="horizon1_label">500m</label>
                     <input class="hor1" type="range" style="width: 200px;" name="horizon1" id="horizon1" value="500" min="100" max="25000" " />

                     
                 <p>Horizon 2:</p>    
                 <div id="title_horizon2" style="font-size:x-small">Set distance value (max. 25000m)</div>
                     <label for="horizon2" id="horizon2_label">1000m</label>
                     <input class="hor2" type="range" style="width: 200px;"  name="horizon2" id="horizon2" value="1000" min="100" max="25000" " />

                     
            </div>
            <br>
            <div>
                 <div>
                    <label for="horizonType" style="display: nowrap;">Horizon type:</label>
                    <select name="horizonType" id="horizonType" style="display: nowrap;">
                        <option value="DISTANCE">DISTANCE</option>
                        <option value="TRAVEL_TIME">TRAVEL_TIME</option>
                    </select>
                </div>
                <br>
                <div>
                    <label for="drivingDirection" style="display: nowwrap;">Driving direction:</label>
                    <select name="drivingDirection" id="drivingDirection" style="display: nowrap;">
                        <option value="OUTBOUND">OUTBOUND</option>
                        <option value="INBOUND">INBOUND</option>
                    </select>
                </div>
            </div>
           
    `;      

            div.innerHTML = html;

            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.disableClickPropagation(div);

            return div;
        };
        routingControl.addTo(map);
        document.getElementById("vehicleProfile").addEventListener("change", fetchRoute);
        document.getElementById("horizon1").addEventListener("change", fetchRoute);
        document.getElementById("horizon2").addEventListener("change", fetchRoute);
        document.getElementById("horizonType").addEventListener("change", checkHorizonType);
        document.getElementById("drivingDirection").addEventListener("change", fetchRoute);
    }


    //Changing the limits for distance and time values due to diffent units
    function checkHorizonType(){
        if(document.getElementById("horizonType").value == "DISTANCE"){
                //set new slider values
                //limit 25000 m
                document.getElementById("horizon1").value = 500;
                document.getElementById("horizon1").min = 100;
                document.getElementById("horizon1").max = 25000;
                document.getElementById("horizon2").value = 1000;
                document.getElementById("horizon2").min = 110;
                document.getElementById("horizon2").max = 25000;
            
            document.getElementById("title_horizon1").innerHTML = "Horizon 1: Set distance value (max. 25000 m)";    
            document.getElementById("title_horizon2").innerHTML = "Horizon 2: Set distance value (max. 25000 m))";
        }
        else{   
                //set new slider values
                //limit 1200
                document.getElementById("horizon1").value = 60;
                document.getElementById("horizon1").min = 10;
                document.getElementById("horizon1").max = 1200;
                document.getElementById("horizon2").value = 800;
                document.getElementById("horizon2").min = 20;
                document.getElementById("horizon2").max = 1200;

            document.getElementById("title_horizon1").innerHTML = "Set time value (max. 1200 s)";    
            document.getElementById("title_horizon2").innerHTML = "Set time value (max. 1200 s)";
            }
            
            fetchRoute();
    }

    //Call PTV Routing API
    fetchRoute();

    function fetchRoute() {
        let resStatus = 0;
        // The definition of the REST parameters differs from geocoding because the waypoint parameter will occur multiple times.
        fetch(
                "https://api.myptv.com/routing/v1/reachable-areas" + getReachableAreasQuery(), {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "apiKey": api_key 
                }
            }
                
            )
            .then(response => {
                resStatus = response.status

                return response.json()
            })
            .then(result => {
                 switch (resStatus) {
                 case 400:
                     alert(result.causes[0].description);
                 break
             }
                //Evaluate result and display polyogons
                displayPolygons(map, result);
            })
            .catch(error => {
                console.log(error);
            });
    }

    //Building requeset parameters for reachable areas calculation.
function getReachableAreasQuery() {
        var reachableQuery = "?waypoint=" + startPosition.lat + "," + startPosition.lng;
      
        if (document.getElementById("vehicleProfile").value !== "") {
            vehicleProfile = document.getElementById("vehicleProfile").value;
            reachableQuery += "&profile=" + vehicleProfile;
        }
        if (document.getElementById("horizon1").value !== "") {
            horizon1 = document.getElementById("horizon1").value;
            document.getElementById("horizon1_label").innerHTML = horizon1; 
            reachableQuery += "&horizons=" + document.getElementById("horizon1").value + "," + document.getElementById("horizon2").value;
        }
        if (document.getElementById("horizon2").value !== "") {
            horizon2 = document.getElementById("horizon2").value;
            document.getElementById("horizon2_label").innerHTML = horizon2; 
        }
        if (document.getElementById("horizonType").value !== "") {
        
            reachableQuery += "&horizonType=" + document.getElementById("horizonType").value;
        }
        if (document.getElementById("drivingDirection").value !== "") {
            reachableQuery += "&options[drivingDirection]=" + document.getElementById("drivingDirection").value;
        }
        return reachableQuery;
    } 
    


    function displayPolygons(map, poly) {

        poly1 = JSON.parse(poly.polygons[0]);
        poly2 = JSON.parse(poly.polygons[1]);
        

        if (horizonLayer1 !== null) {
            map.removeLayer(horizonLayer1);
            map.removeLayer(horizonLayer2);
        }


       var myStyle = {
            "color": '#2882C8',
            "weight": 5,
            "opacity": 0.65
        };
        
        var myStyle2 = {
            "color": '#f56942',
            "weight": 5,
            "opacity": 0.8
        };

        horizonLayer1 = L.geoJSON(poly1, {
            style: myStyle
        }).addTo(map);

        horizonLayer2 = L.geoJSON(poly2, {
            style: myStyle2
        }).addTo(map);

        map.fitBounds(horizonLayer2.getBounds());
    }
});
