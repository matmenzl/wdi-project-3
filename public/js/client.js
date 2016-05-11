var SunApp = SunApp || {};

SunApp.initialize = function(){
  $("main").on("submit", "form", this.submitForm);
  $("header nav a").on("click", this.changePage);
  $("#logout").on("click", this.logout);
  SunApp.checkLoginState();
  SunApp.bindLinkClicks();
}

SunApp.removeToken = function(){
  return window.localStorage.removeItem("token")
}

SunApp.getToken = function(){
  return window.localStorage.getItem("token")
}

SunApp.setToken = function(token){
  return window.localStorage.setItem('token', token)
}

SunApp.saveTokenIfPresent = function(data){
  if (data.token) {
    this.setToken(data.token);
    SunApp.checkLoginState();
  }
}

SunApp.ajaxRequest = function(method, url, data, tpl, callback){
  console.log("Making request for: ", url);

  return $.ajax({
    method: method,
    url: "http://localhost:3000/api" + url,
    data: data,
    beforeSend: this.setRequestHeader
  }).done(function(data){
    
    if (typeof callback === "function") return callback(data);
    
    SunApp.saveTokenIfPresent(data);
    if (tpl) SunApp.getTemplate(tpl, data);

  }).fail(function(data){
    alert("Error");
    console.log(data.statusText);
  });
}

SunApp.getTemplate = function(tpl, data, continent){
  var templateUrl = "http://localhost:3000/templates/" + tpl + ".html";
  $.ajax({
    url: templateUrl,
    method: "GET",
    dataType: "html"
  }).done(function(templateData){
    var parsedTemplate = _.template(templateData);
    var compiledTemplate = parsedTemplate(data);
    $("main").html(compiledTemplate);
    // If there is a #map-canvas element on the underscore template, then load the world map
    if ($("#map-canvas").length > 0) {
      if (continent == "world") SunApp.createWorldMap();
      else {
        return SunApp.createRegionMap(continent);
      }
    }
  })
}

SunApp.bindLinkClicks = function() {
  $("body").on("click", "a.map-region", this.linkClick);
}

SunApp.linkClick = function() {
  event.preventDefault();
  var continent = this.id
  console.log(continent)
  var tpl = $(this).data("template");
  return SunApp.getTemplate(tpl, null, continent);
}

SunApp.changePage = function(){
  event.preventDefault();
  var url = $(this).attr("href");
  var tpl = $(this).data("template");
  if (tpl != "home") {
    $('body').attr("id", "");
  } else {
    $('body').attr("id", "home");
  }

  if (url) return SunApp.ajaxRequest("get", url, null, tpl);
  return SunApp.getTemplate(tpl, null);
}

SunApp.submitForm = function(){
  event.preventDefault();

  var method = $(this).attr('method');
  var url    = $(this).attr("action");
  var tpl    = $(this).data("template");
  var data   = $(this).serialize();
  return SunApp.ajaxRequest(method, url, data, tpl);
}

SunApp.checkLoginState = function(){
  var self = this;
  if (self.getToken()) {
    return self.loggedInState();
  } else {
    return self.loggedOutState();
  }
}

SunApp.logout = function(){
  event.preventDefault();
  SunApp.removeToken();
  SunApp.checkLoginState();
}

SunApp.loggedInState = function(){
  $(".loggedIn").show();
  $(".loggedOut").hide();
}

SunApp.loggedOutState = function(){
  $(".loggedIn").hide();
  $(".loggedOut").show();
}

SunApp.setRequestHeader = function(xhr, settings) {
  var token = SunApp.getToken();
  if (token) return xhr.setRequestHeader('Authorization','Bearer ' + token);
}

SunApp.addInfoWindowForCity = function(city, marker){
  var self = this;
  google.maps.event.addListener(marker, "click", function(){
    console.log(city.name)

    if(typeof self.infowindow != "undefined") self.infowindow.close();

    self.infowindow = new google.maps.InfoWindow({
      content: "<p>"+city.name+"</p>"
    });
    self.infowindow.open(self.map, this);
  })
}

SunApp.addInfoWindowForCity = function(city, marker){
  var self = this;
  google.maps.event.addListener(marker, "click", function(){
    console.log(city.name)

    if(typeof self.infowindow != "undefined") self.infowindow.close();

    self.infowindow = new google.maps.InfoWindow({
      content: "<p>"+city.name+"</p>"
    });
    self.infowindow.open(self.map, this);
  })
}

SunApp.addInfoWindowForCity = function(city, marker){
  var self = this;
  google.maps.event.addListener(marker, "click", function(){
    console.log(city.name)

    if(typeof self.infowindow != "undefined") self.infowindow.close();

    self.infowindow = new google.maps.InfoWindow({
      content: "<p>"+city.name+"</p>"+"<p>"+city.continent+"</p>"
    });
    self.infowindow.open(self.map, this);
  })
}

SunApp.createMarkerForCity = function(city, timeout) {
  var self   = this;
  var latlng = new google.maps.LatLng(city.latitude, city.longitude);
  var marker = new google.maps.Marker({
    position: latlng,
    map: self.map,
    icon: "./images/beach-pin-final.png"
  })
  console.log(marker)
  self.addInfoWindowForCity(city, marker)
}

SunApp.loopThroughCities = function(data) {
  return $.each(data.cities, function(i, city) {
    if (city.sunny === true) {
      console.log(city)
      SunApp.createMarkerForCity(city, i*10);
    }
  })
}

SunApp.limiter = function(){
  var map = this.map;
  google.maps.event.addListener(map, "drag", function() {
    var proj = map.getProjection();
    var bounds = map.getBounds();
    var sLat = map.getBounds().getSouthWest().lat();
    var nLat = map.getBounds().getNorthEast().lat();
    if (sLat < -85 || nLat > 85) {
      console.log("too much grey!!!!!!!");
      map.setCenter(new google.maps.LatLng(0, 11.15))
    }
  })
}

SunApp.createWorldMap = function() {
  this.canvas = document.getElementById("map-canvas");

  var mapOptions = {
    zoom: 2,
    minZoom: 2,
    maxZoom: 15,
    center: new google.maps.LatLng(0, 11.15),
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#e0efef"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"hue":"#1900ff"},{"color":"#c0e8e8"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"visibility":"on"},{"lightness":700}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#70B8B8"}]}]
  }
  this.map = new google.maps.Map(this.canvas, mapOptions);
  
  SunApp.ajaxRequest("GET", "/cities", null, null, SunApp.loopThroughCities);
  this.limiter();
}

SunApp.createRegionMap = function(continentId) {
  this.canvas = document.getElementById("map-canvas");

  var mapOptions = {
    zoom: 3,
    minZoom: 2,
    maxZoom: 15,
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#e0efef"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"hue":"#1900ff"},{"color":"#c0e8e8"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"visibility":"on"},{"lightness":700}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#70B8B8"}]}]
  }

  SunApp.map = new google.maps.Map(this.canvas, mapOptions);

  var geocoder = new google.maps.Geocoder();
    geocoder.geocode( { 'address': continentId }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        SunApp.map.setCenter(results[0].geometry.location);
      } else {
        alert("Could not find location: " + location);
      }
  });

  SunApp.ajaxRequest("GET", "/cities", null, null, SunApp.loopThroughCities);
  this.limiter();
}

$(function(){
  SunApp.initialize();

})


// 35fff62f-529e-4063-8019-7ec77610a28b

// 
// <script type="text/javascript">
//    skyscanner.load("snippets","2");
//    function main(){
//        var snippet = new skyscanner.snippets.SearchPanelControl();
//        snippet.setShape("box300x250");
//        snippet.setCulture("en-GB");
//        snippet.setCurrency("GBP");
//        snippet.setDestination("MCT", true);
//        snippet.setProduct("flights","1");
//        snippet.setProduct("hotels","2");
//        snippet.setProduct("carhire","3");

//        snippet.draw(document.getElementById("snippet_searchpanel"));
//    }
//    skyscanner.setOnLoadCallback(main);
// </script>
// <div id="snippet_searchpanel" style="width: auto; height:auto;"></div>
