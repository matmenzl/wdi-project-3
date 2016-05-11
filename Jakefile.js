var rp = require("request-promise");
var config = require("./config/config");
var mongoose = require('mongoose');
mongoose.connect(config.database);

var City = require("./models/city");

var cities = [
  {
    name: "Paris",
    latitude: 48.8589996,
    longitude: 2.2071294,
    continent: "Europe"
  },
  {
    name: "New York",
    latitude: 40.70583,
    longitude: -74.2588803,
    continent: "NAmerica"
  },
  {
    name: "Aberdeen",
    latitude: 57.149717, 
    longitude: -2.094278,
    continent: "Europe"
  },
  {
    name: "Marrakech",
    latitude: 31.629472, 
    longitude: -7.981084,
    continent: "Africa"
  },
  {
    name: "Athens",
    latitude: 37.983917, 
    longitude: 23.72936,
    continent: "Europe"
  },
  {
    name: "Bali",
    latitude: -8.696808,
    longitude: 115.208817,
    continent: "Asia"
  },
  {
    name: "Singapore",
    latitude: 1.302755,
    longitude: 103.862686,
    continent: "Asia"
  },
  {
    name: "Columbo",
    latitude: 6.908321,
    longitude: 79.867172,
    continent: "Asia"
  },
  {
    name: "Sydney",
    latitude: -33.923492,
    longitude: 151.225433,
    continent: "Australasia"
  },
  {
    name: "Tokyo",
    latitude: 35.702718,
    longitude: 139.733047,
    continent: "Asia"
  },
  {
    name: "Cape Town",
    latitude: -33.931557,
    longitude: 18.467674,
    continent: "Africa"
  },
  {
    name: "Brasilia",
    latitude: -15.837508,
    longitude: -47.872925,
    continent: "SAmerica"
  },
  {
    name: "Muscat",
    latitude: 23.497885, 
    longitude: 58.502197,
    continent: "Asia"
  }
]

function seedCities() {
  City.collection.drop();
  cities.forEach(function(city) {
    City.create(city, function(err, city) {
      if (err) console.log(err);
      console.log("City saved: " + city);
    });
  })
}

var url = 'https://api.forecast.io/forecast/22d9a931630b36afe6057543b3031a61/';

function crawlCities() {
  City.find({}, function(err, cities) {
    cities.forEach(function(city) {
      rp(url + city.latitude + "," + city.longitude)
        .then(function(data) {
          
          var parsedData = JSON.parse(data);
          
          // Get the daily data
          var cityData    = parsedData.daily.data;
          city.summary    = parsedData.daily.summary;
          city.sunny      = true;

          var clearWeather = [
            "clear-day", 
            "clear-night", 
            "partly-cloudy-night", 
            "partly-cloudy-day"
          ];

          var i = 0;
          while (city.sunny && i < cityData.length) {
            if (clearWeather.indexOf(cityData[i].icon) === -1) city.sunny = false;
            i++;
          }

          console.log(city.summary);
          
          city.save(function(err, city) {
            if (err) return console.log(err);
            console.log(city.name + " was saved");
          });
        })
        .catch(function (err) {
          console.log("error")
        });
    });
  });
}

desc('Crawling cities for sun sun sun.');
task('default', crawlCities);
task("seed", seedCities);