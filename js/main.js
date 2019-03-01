var x = document.getElementById('maperror');
var option = {timeout:10000};
var xmlhttp = new XMLHttpRequest();
var result;
var map;
var marker;
var myOptions;
var lat;
var lon;
var latlon = [];

var mapholder = document.getElementById('mapholder');
    mapholder.style.height = '520px';
    mapholder.style.width = '90%';
    
var mapholder_search = document.getElementById('mapholder_search');
    mapholder_search.style.height = '400px';
    mapholder_search.style.width = '90%';
    
var red_pushpin = "http://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png";
var gas = "http://maps.google.com/mapfiles/kml/shapes/gas_stations.png";

$(document).ready(function() {
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        result = JSON.parse(this.responseText);
      }
    };
    xmlhttp.open("GET", "taiwan_toilet.json", true);
    xmlhttp.send();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition, showError, option);
    } 
    else { 
      x.innerHTML = "Geolocation is not supported by this browser.";
    }
});

function showPosition(position) {
  var centerPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
  myOptions = {
    center: centerPos,
    zoom: 15,
    mapTypeId:google.maps.MapTypeId.ROADMAP,
    mapTypeControl:false,
    navigationControlOptions:{style:google.maps.NavigationControlStyle.SMALL}
  }
  
  var positionString = '<div id="content">'+
    '<h1 id="firstHeading" class="firstHeading">我在這！</h1>'+
    '</div>';
    
  var infowindow = new google.maps.InfoWindow({
    content: positionString
  });
  
  //我的位置
  map = new google.maps.Map(document.getElementById("mapholder"), myOptions);
  map_search = new google.maps.Map(document.getElementById("mapholder_search"), myOptions);
  marker = new google.maps.Marker({
    position:centerPos,
    map:map,
    icon:red_pushpin,
    title:"我在這！"
  });
  
  marker_search = new google.maps.Marker({
    position:centerPos,
    map:map_search,
    icon:red_pushpin,
    title:"我在這！"
  });
  
  //搜尋
  // Create the search box and link it to the UI element.
  var search = document.getElementById('search_input');
  var searchBox = new google.maps.places.SearchBox(search);
  map_search.controls[google.maps.ControlPosition.TOP].push(search);
  // Bias the SearchBox results towards current map's viewport.
  map_search.addListener('bounds_changed', function() {
    searchBox.setBounds(map_search.getBounds());
  });
  $('.ui-input-text').hide();
  var markers_search = [];
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }

    // Clear out the old markers_search.
    markers_search.forEach(function(marker) {
      marker.setMap(null);
    });
    markers_search = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      
      var icon = {
        url: place.icon,
        // size: new google.maps.Size(71, 71),
        // origin: new google.maps.Point(0, 0),
        // anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(50, 50)
      };
      
      // Create a marker for each place.
      markers_search.push(new google.maps.Marker({
        map: map_search,
        title: place.name,
        position: place.geometry.location,
        icon:icon
      }));
      
      //視窗移動
      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } 
      else {
        bounds.extend(place.geometry.location);
      }
    });
    map_search.fitBounds(bounds);
  });
  
  var x = document.getElementById("show");
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  
  $("#button_search").off("vclick");
  $("#button_search").on("vclick", function(event){
      radius = ($("#range").val()*1000);
      alert("尋找範圍: "+radius+" 公尺(M)");
      go();
  });
  
  function go(){
    var service = new google.maps.places.PlacesService(map_search);
    service.nearbySearch({
      location: centerPos,
      radius: radius,
      keyword: "加油站"
      // type: ['restaurant']
    }, callback);
    
    function callback(results, status){
      // alert(status);
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
      }
    }
   
    function createMarker(place) {
      var placeLoc = place.geometry.location;
      var marker = new google.maps.Marker({
          map: map_search,
          position: place.geometry.location,
          icon:gas
      });
      
      google.maps.event.addListener(marker, 'click', function() {
          infowindow.setContent(place.name);
          infowindow.open(map_search,this);
      });
      
      google.maps.event.addListener(marker, 'dblclick', function() {
          directionsDisplay.setMap(map_search);
          directionsService.route({
              origin: centerPos,
              destination: placeLoc,
              travelMode: 'DRIVING'
          }, 
          function(response, status) {
            if (status === 'OK') {
              directionsDisplay.setDirections(response);
              var dirStepArr = response.routes[0].legs[0];
              var dirStep = dirStepArr.steps.length;
              // alert(dirStep);
              
              if (dirStep > 0) {
                var stepString = "";
                for (var i = 0 ; i < dirStep ; i++) {
                    stepString += dirStepArr.steps[i].instructions.trim();
                }
                x.innerHTML = stepString;
              }
            } 
            else {
                window.alert('Directions request failed due to ' + status);
            }
          });
      });
    }
  }
}

function showtoilet(){
  var toiletString = [];
  var icon_man = "http://maps.google.com/mapfiles/kml/shapes/man.png";
  var icon_woman = "http://maps.google.com/mapfiles/kml/shapes/woman.png";
  var icon_wheel_chair_accessible = "http://maps.google.com/mapfiles/kml/shapes/wheel_chair_accessible.png";
  var markers = [];
  var infowindow = new google.maps.InfoWindow();
 
  //公廁位置    
  for (var i = 0; i < result.length; i++) {
    lat = result[i]["Latitude"];
    lon = result[i]["Longitude"];
    latlon[i] = new google.maps.LatLng(lat, lon);
  
    //toilet內容
    toiletString[i] = '<div id="content">'+
    '<h1 id="firstHeading" class="firstHeading">' + result[i]["Grade"] + '</h1>'+
    '<h1 id="secondHeading" class="secondHeading">' + result[i]["Type"] + '</h1>'+
    '<p><b>' + result[i]["Address"] + '</b></p>' +
    '</div>';
  
    if(result[i]["Type"] == '男廁所'){
      marker = new google.maps.Marker({
        position:latlon[i],
        map:map,
        icon:icon_man,
        title:result[i]["Address"] + " " + result[i]["Grade"] + " " + result[i]["Type"]
      });
    }
    else if(result[i]["Type"] == '女廁所'){
      marker = new google.maps.Marker({
        position:latlon[i],
        map:map,
        icon:icon_woman,
        title:result[i]["Address"] + " " + result[i]["Grade"] + " " + result[i]["Type"]
      });
    }
    else if(result[i]["Type"] == '無障礙廁所'){
      marker = new google.maps.Marker({
        position:latlon[i],
        map:map,
        icon:icon_wheel_chair_accessible,
        title:result[i]["Address"] + " " + result[i]["Grade"] + " " + result[i]["Type"]
      });
    }
    markers.push(marker);
    
    google.maps.event.addListener(marker, 'click', (function(marker, i) {
      return function() {
        infowindow.setContent(toiletString[i]);
        infowindow.open(map, marker);
      }
    })(marker, i));
  }
    
  var markerCluster = new MarkerClusterer(map, markers,
  {
    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
  });
  
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            x.innerHTML = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            x.innerHTML = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            x.innerHTML = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            x.innerHTML = "An unknown error occurred.";
            break;
    }
}

$('#index_button').click(function(){
  $('#toilet').css("display","block");
  $('#search').css("display","none");
  $('#qrcode_scanner').css("display","none");
  $('#title').text("全國公廁位置圖");
});

$('#search_button').click(function(){
  $('#toilet').css("display","none");
  $('#search').css("display","block");
  $('#qrcode_scanner').css("display","none");
  $('#title').text("搜尋");
});

$('#qrcode_button').click(function(){
  $('#toilet').css("display","none");
  $('#search').css("display","none");
  $('#qrcode_scanner').css("display","block");
  $('#title').text("QRcode Scanner");
});