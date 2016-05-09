var SunApp = SunApp || {};

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
  // hideErrors();
  // hideUsers();
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

SunApp.logout = function(){
  event.preventDefault();
  removeToken();
  return loggedOutState();
}

SunApp.loggedInState = function(){
  // $("section, .logged-out").hide();
  // $(".users, .logged-in").show();
  // return getUsers();
}

SunApp.loggedOutState = function(){
  // $("section, .logged-in").hide();
  // $("#register, .logged-out").show();
  // return hideUsers();
}

SunApp.initialize = function(){
  // $("form").on("submit", this.submitForm);
  $("main").on("submit", "form", this.submitForm);
  
  $("#getUsers").on("click", this.getUsers);
  $("header nav a").on("click", this.changePage);
}

$(function(){
  SunApp.initialize();
})

