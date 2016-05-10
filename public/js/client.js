var SunApp = SunApp || {};

SunApp.initialize = function(){
  $("main").on("submit", "form", this.submitForm);
  $("#getUsers").on("click", this.getUsers);
  $("header nav a").on("click", this.changePage);
}

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
    console.log(data);
    return SunApp.saveTokenIfPresent(data);
  }).fail(function(data){
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
    $("main").empty().append(compiledTemplate);
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

SunApp.displayUsers = function(data, user){
  return $.each(data.users, function(index) {
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
  console.log("loggedout");
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

SunApp.getUsers = function(){
  return ajaxRequest("get", "http://localhost:3000/users", null, displayUsers)
}

SunApp.setRequestHeader = function(xhr, settings) {
  var token = SunApp.getToken();
  if (token) return xhr.setRequestHeader('Authorization','Bearer ' + token);
}

$(function(){
  SunApp.initialize();
})



