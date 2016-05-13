var SunApp = SunApp || {};

SunApp.url;

SunApp.getURL = function(){
  if (window.location.href.indexOf("localhost") !== -1){
    SunApp.url = "http://localhost:3000";
  } else {
    SunApp.url = "https://sevendaysofsun.herokuapp.com";
  }
}

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
  $("main").on("submit", "form.form", this.submitForm);
  $("main").on("submit", "form#sms-form", this.emailSignup);
  $("header nav a").on("click", this.changePage);
  $("#logout").on("click", this.logout);
  SunApp.checkLoginState();
  SunApp.bindLinkClicks();
  SunApp.getTemplate("home");
}

SunApp.removeToken = function(){
  return window.localStorage.removeItem("token");
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
  if (SunApp.getToken() && !SunApp.currentUser) {
    var decodedPayload = jwt_decode(SunApp.getToken());
    return $.ajax({
      method: "GET",
      url: SunApp.url + "/api/users/" + decodedPayload._id,
      beforeSend: SunApp.setRequestHeader
    }).done(function(data) {
      SunApp.currentUser = data.user;
    })
  }
}

SunApp.ajaxRequest = function(method, url, data, tpl, callback){
  return $.ajax({
    method: method,
    url: SunApp.url + "/api" + url,
    data: data,
    beforeSend: SunApp.setRequestHeader
  }).done(function(data){
    if (typeof callback === "function") return callback(data);
    SunApp.saveTokenIfPresent(data);
    if (tpl) SunApp.getTemplate(tpl, data);
  }).fail(function(data){
    console.error(data);
  });
}

SunApp.getTemplate = function(tpl, data, city){
  var templateUrl = SunApp.url + "/templates/" + tpl + ".html";
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
      if (city == null) SunApp.createWorldMap();
      else {

        return SunApp.createCityMap(city);
      }
    } 
  }).fail(function(){
    console.error("Did not load template");
  })
}

SunApp.bindLinkClicks = function() {
  $("body").on("click", "a.map-city", function() {
    event.preventDefault();
    var city = this.id;
    var tpl = $(this).data("template");
    var data = { cities: null };
    return SunApp.getTemplate(tpl, data, city);
  })
  $("body").on("click", "a.map", this.linkClick);
  $("body").on("click", "a.user", this.userShow);
}

SunApp.addFav = function(city) {
  var url = "/users/" + SunApp.currentUser._id + "/favourites";
  var data = { city: city };
  return this.ajaxRequest("POST", url, data);
}

SunApp.userShow = function() {
  event.preventDefault();
  var url = $(this).attr("href")
  return SunApp.ajaxRequest("get", url, null, "users/show")
}

SunApp.linkClick = function() {
  event.preventDefault();
  var tpl  = $(this).data("template");
  var href = $(this).attr("href");
  SunApp.ajaxRequest("get", href, null, tpl)  
}

SunApp.changePage = function(){
  event.preventDefault();
  var url = $(this).attr("href");
  var tpl = $(this).data("template");
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
    if(typeof self.infowindow != "undefined") self.infowindow.close();

    self.infowindow = new google.maps.InfoWindow({
      content: "<h1 id='title'>"+city.name+"</h1><p id='summary'>"+city.summary+"</p><div id='snippet_searchpanel' style='width: auto; height:auto;'></div></br><button id='favourite-button' class='btn btn-primary'>favourite</button>"
    });

    google.maps.event.addListener(self.infowindow, 'domready', function() {
      SunApp.createSkyscannerWidget(SunApp.currentUser.airportCode, city.airportCode);
    });
    self.infowindow.open(self.map, this);
    $("body").on("click", "button#favourite-button", function() {
      SunApp.addFav(city);
    })
  })
}



SunApp.createMarkerForCity = function(city, timeout, i) {

  var self   = this;
  var latlng = new google.maps.LatLng(city.latitude, city.longitude);
    
window.setTimeout(function(){
   var marker = new google.maps.Marker({
    position: latlng,
    map: self.map,
    icon: "./images/beach-pin-final.png",
    animation: google.maps.Animation.DROP
  })
  self.addInfoWindowForCity(city, marker);
}, timeout)
}

SunApp.loopThroughCities = function(data) {
  console.log(data);
  return $.each(data.cities, function(i, city) {
    if (city.sunny === true) {
      SunApp.createMarkerForCity(city, i*100);
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
    zoomControl: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#D5E2EA"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#e2ead5"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dedede"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]}]
  }
  this.map = new google.maps.Map(this.canvas, mapOptions);
  
  SunApp.ajaxRequest("GET", "/cities", null, null, SunApp.loopThroughCities);
  this.limiter();
}

SunApp.createCityMap = function(cityId) {
  this.canvas = document.getElementById("map-canvas");

  var mapOptions = {
    zoom: 6,
    minZoom: 2,
    maxZoom: 15,
    center: new google.maps.LatLng(0, 11.15),
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#e9e9e9"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dedede"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]}]
  }
  SunApp.map = new google.maps.Map(this.canvas, mapOptions);

  var geocoder = new google.maps.Geocoder();
    geocoder.geocode( { 'address': cityId }, function(results, status) {
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

  snippet.setOutboundDate(today);
  snippet.setInboundDate(nextWeek);
  snippet.setShape("box300x250");
  snippet.setCulture("en-GB");
  snippet.setCurrency("GBP");
  snippet.setDeparture(origin, true);
  snippet.setDestination(destination, true);
  snippet.setProduct("flights","1");
  snippet.setProduct("hotels","2");
  snippet.setProduct("carhire","3");
  snippet.draw(container);
}


SunApp.emailSignup = function() {
    event.preventDefault();
    var sms = $('#sms').val();
    var baseURL = 'https://docs.google.com/a/tages-anzeiger.ch/forms/d/1q-oZ7IS5MinZawIf9xbXj3diAFhhdtJW9ojKaHS3Wio/formResponse';
    // var submitRef = '&submit=submit';
    // var submitURL = (baseURL + sms + submitRef);
    // $(this)[0].action=submitURL;
    // console.log(submitURL);
    console.log(sms);

    return $.ajax({
        method: 'POST',
        dataType: 'jsonp',
        url: baseURL,
        data: { "entry.1355049609": sms },
        beforeSend: SunApp.setRequestHeader
      }).done(function(data){
        if (typeof callback === "function") return callback(data);
        SunApp.saveTokenIfPresent(data);
        if (tpl) SunApp.getTemplate(tpl, data);
      }).fail(function(data){
        alert("Error");
        console.log(data);
      });

    $('#sms').addClass('active').val('Thank You!');
    setTimeout(function(){
      $('#form-container').hide();
      $('#update-form').animate({'width': '0px'},300,function(){
        $('#get-updates-link').hide();
      });
    },1000); 
}


$(function(){
  SunApp.getURL();
  SunApp.initialize();
  skyscanner.load("snippets","2");
  SunApp.getCurrentUser();
})


