var SunApp = SunApp || {};

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

SunApp.ajaxRequest = function(method, url, data){
  return $.ajax({
    method: method,
    url: "http://localhost:3000/api" + url,
    data: data,
    beforeSend: this.setRequestHeader
  }).done(function(data){
    console.log(data)
    return SunApp.saveTokenIfPresent(data);
  }).fail(function(data){
    console.log(data.responseJSON.message);
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
  return SunApp.ajaxRequest("get", "/users");
}

SunApp.initialize = function(){
  $("main").on("submit", "form", this.submitForm);
  $("#getUsers").on("click", this.getUsers);
  $("header nav a").on("click", this.changePage);
}

SunApp.createMarkerForCity = function(city, timeout) {
  var self   = this;
  var latlng = new google.maps.LatLng(city.latitude, city.longitude);
  window.setTimeout(function() {
    var marker = new google.maps.Marker({
      position: latlng,
      map: self.map,
      icon: "./images/marker.png"
    })
  }, timeout)
}

SunApp.loopThroughCities = function(data) {
  return $.each(data.cities, function(i, city) {
    SunApp.createMarkerForCity(city, i*10);
  })
}

SunApp.getCities = function() {
  var self = this;
  $.ajax({
    type: "GET",
    url: "http://localhost:3000/cities"
  }).done(self.loopThroughCities);
}

SunApp.createWorldMap = function() {
  this.canvas = document.getElementById("map-canvas");

  var mapOptions = {
    zoom: 12,
    center: new google.maps.LatLng(51.506178, -0.088369),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  this.map = new google.maps.Map(this.canvas, mapOptions);
  this.getCities();
}

$(function(){
  SunApp.initialize();
})

