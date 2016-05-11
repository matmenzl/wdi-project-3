var SunApp = SunApp || {};

SunApp.nextweek = function(){
  var today = new Date();
  var nextweek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7);
  return nextweek;
}

SunApp.formatDate = function(date) {
  var month = '' + (date.getMonth() + 1);
  var day   = '' + date.getDate();
  var year  = date.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

SunApp.initialize = function(){
  $("main").on("submit", "form", this.submitForm);
  $("header nav a").on("click", this.changePage);
  $("#logout").on("click", this.logout);
  SunApp.checkLoginState();
  SunApp.bindLinkClicks();
  SunApp.getTemplate("home");
}

SunApp.removeToken = function(){
  return window.localStorage.removeItem("token")
}

SunApp.getToken = function(){
  return window.localStorage.getItem("token")
}

SunApp.setToken = function(token){
  window.localStorage.setItem('token', token);
  return SunApp.getCurrentUser();
}

SunApp.saveTokenIfPresent = function(data){
  if (data.token) {
    this.setToken(data.token);
    SunApp.checkLoginState();
  }
}

SunApp.getCurrentUser = function() {
  if (SunApp.getToken()) var decodedPayload = jwt_decode(SunApp.getToken());
  return $.ajax({
    method: "GET",
    url: "http://localhost:3000/api/users/" + decodedPayload._id,
    beforeSend: SunApp.setRequestHeader
  }).done(function(data) {
    SunApp.currentUser = data.user;
  })
}

SunApp.ajaxRequest = function(method, url, data, tpl, callback){
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
  var continent = this.id;
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
  SunApp.currentUser = null;
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
      content: "<p>"+city.name+"</p><p>"+city.summary+"</p><div id='snippet_searchpanel' style='width: auto; height:auto;'></div>"
    });

    google.maps.event.addListener(self.infowindow, 'domready', function() {
      // SunApp.createSkyscannerWidget(SunApp.currentUser.airportCode, city.airportCode);
      SunApp.createSkyscannerWidget("London Heathrow", city.airportCode);
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
  self.addInfoWindowForCity(city, marker)
}

SunApp.loopThroughCities = function(data) {
  return $.each(data.cities, function(i, city) {
    if (city.sunny === true) {
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

SunApp.createSkyscannerWidget = function(origin, destination){
  var snippet   = new skyscanner.snippets.SearchPanelControl();
  var container = document.getElementById("snippet_searchpanel");

  var today     = SunApp.formatDate(new Date())
  var nextWeek  = SunApp.formatDate(SunApp.nextweek());
  if (window.localStorage.token){
    console.log("There's a token!")
  }
  snippet.setOutboundDate(today);
  snippet.setInboundDate(nextWeek);
  snippet.setShape("box300x250");
  snippet.setCulture("en-GB");
  snippet.setCurrency("GBP");
  snippet.setDeparture(origin, true);
  snippet.setDestination(destination, true);
  // snippet.setDestination("MCT", true);
  snippet.setProduct("flights","1");
  snippet.setProduct("hotels","2");
  snippet.setProduct("carhire","3");
  snippet.draw(container);
}

$(function(){
  SunApp.initialize();
  skyscanner.load("snippets","2");
})


// 35fff62f-529e-4063-8019-7ec77610a28b
