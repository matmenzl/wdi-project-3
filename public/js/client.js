var SunApp = SunApp || {};


SunApp.initialize = function(){
  $("main").on("submit", "form", this.submitForm);
  $("header nav a").on("click", this.changePage);
  $("a#users").on("click", this.getUsers);
}
// ***** USER AUTHENTICATION *****

SunApp.getToken = function(){
  return window.localStorage.getItem("token")
}

SunApp.setToken = function(token){
  return window.localStorage.setItem('token', token)
}

SunApp.saveTokenIfPresent = function(data){
  if (data.token) return this.setToken(data.token)
    return false;
}

SunApp.setRequestHeader = function(xhr, settings){
  var token = SunApp.getToken();
  if (token) return xhr.setRequestHeader("Authorization", "Bearer " + token)
}

SunApp.ajaxRequest = function(method, url, data, callback){
  return $.ajax({
    method: method,
    url: "http://localhost:3000/api" + url,
    data: data,
    beforeSend: this.setRequestHeader
  }).done(function(data){
    if (typeof callback === "function") callback(data);
    return SunApp.saveTokenIfPresent(data);
  }).fail(function(data){
    alert("Error");

    console.log(data.statusText);
  });
}

SunApp.getTemplate = function(tpl, data){
  var templateUrl = "http://localhost:3000/templates/" + tpl + ".html";
  $.ajax({
    url: templateUrl,
    method: "GET",
    dataType: "html"
  }).done(function(templateData){
    var parsedTemplate = _.template(templateData);
    var compiledTemplate = parsedTemplate(data);
    $("main").html(compiledTemplate);
    if ($("#map-canvas").length > 0) SunApp.createWorldMap();
  })
}

SunApp.changePage = function(){
  event.preventDefault();
  var tpl = ($(this).data("template"));
  return SunApp.getTemplate(tpl, null);
}

SunApp.submitForm = function(){
  event.preventDefault();

  var method = $(this).attr('method');
  var url    = $(this).attr("action");
  var data   = $(this).serialize();

  return SunApp.ajaxRequest(method, url, data);
}

SunApp.getUsers = function(){
  event.preventDefault();
  console.log("getUsers");
  return SunApp.ajaxRequest("get", "/users", null, SunApp.displayUsers);
}

SunApp.displayUsers = function(data){
  console.log("displayUsers");
  return $.each(data.users, function(index, user) {
    $(".users").prepend('<div class="media">' +
      '<div class="media-left">' +
      '<a href="#">' +
      '<img class="media-object" src="' + user.image +'">' +
      '</a>' +
      '</div>' +
      '<div class="media-body">' +
      '<h4 class="media-heading">@' + user.username + '</h4>' +
      '<p>' + user.firstName + '</p>'+
      '</div>' +
      '</div>');
  });
}

SunApp.checkLoginState = function(){
  if (getToken()) {
    return loggedInState();
  } else {
    return loggedOutState();
  }
}

SunApp.showPage = function() {
  event.preventDefault();
  var linkClass = $(this).attr("class").split("-")[0]
  $("section").hide();
  hideErrors();
  return $("#" + linkClass).show();
}

SunApp.logout = function(){
  event.preventDefault();
  removeToken();
  return loggedOutState();
}

SunApp.hideUsers = function(){
  return $(".users").empty();
}

SunApp.hideErrors = function(){
  return $(".alert").removeClass("show").addClass("hide");
}

SunApp.displayErrors = function(data){
  return $(".alert").text(data).removeClass("hide").addClass("show");
}

SunApp.loggedInState = function(){
  $(".register, .login").hide();
  return getUsers();
}

SunApp.loggedOutState = function(){
  $(".register, .login").show();
  return hideUsers();
}

// SunApp.getUsers = function(){
//   return SunApp.ajaxRequest("get", "http://localhost:3000/api/users", null, displayUsers)
// }

SunApp.setRequestHeader = function(xhr, settings) {
  var token = SunApp.getToken();
  if (token) return xhr.setRequestHeader('Authorization','Bearer ' + token);
}

SunApp.createMarkerForCity = function(city, timeout) {
  var self   = this;
  var latlng = new google.maps.LatLng(city.latitude, city.longitude);
  // window.setTimeout(function() {
    var marker = new google.maps.Marker({
      position: latlng,
      map: self.map,
      icon: "./images/beach-pin-final.png"
    })
  // }, timeout)
}

SunApp.loopThroughCities = function(data) {
  return $.each(data.cities, function(i, city) {
    SunApp.createMarkerForCity(city, i*10);
  })
}

SunApp.getCities = function() {
  var self = this;
  return SunApp.ajaxRequest("GET", "/cities", null, SunApp.loopThroughCities)
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
  this.getCities();
  this.limiter();
}

$(function(){
  SunApp.initialize();
})



