var SunApp = SunApp || {};

SunApp.getToken = function(){
  return window.localStorage.getItem("token")
}

SunApp.setToken = function(token){
  return window.localStorage.setItem("token", token);
}

SunApp.saveTokenIfPresent = function(data) {
  if (data.token) return this.setToken(data.token);
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
    $("main").empty().append(compiledTemplate);
  })
}


SunApp.changePage = function(){
  event.preventDefault();
  var tpl = ($(this).data("template"));
  SunApp.getTemplate(tpl, null);
}


SunApp.submitForm = function(){
  event.preventDefault();

  var method = $(this).attr('method');
  var url    = $(this).attr("action")
  var data   = $(this).serialize();
  return SunApp.ajaxRequest(method, url, data);
}

SunApp.getUsers = function(){
    return SunApp.ajaxRequest("get", "/users");
}
SunApp.initialize = function(){
  $("form").on("submit", this.submitForm);
  $("#getUsers").on("click", this.getUsers);
  $("header nav a").on("click", this.changePage);
}

$(function(){
  SunApp.initialize();
})