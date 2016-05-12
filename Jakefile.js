var rp       = require("request-promise");
var config   = require("./config/config");
var mongoose = require('mongoose');

mongoose.connect(config.database, function(){
  console.log("connected");
});

var City = require("./models/city");

var cities = [
  {
    name: "Paris",
    latitude: 48.8589996,
    longitude: 2.2071294,
    continent: "Europe",
    airportCode: "CDG"
  },
  {
    name: "New York",
    latitude: 40.70583,
    longitude: -74.2588803,
    continent: "NAmerica",
    airportCode: "JFk"
  },
  {
    name: "Aberdeen",
    latitude: 57.149717, 
    longitude: -2.094278,
    continent: "Europe",
    airportCode: "ABZ"
  },
  {
    name: "Marrakech",
    latitude: 31.629472, 
    longitude: -7.981084,
    continent: "Africa",
    airportCode: "RAK"
  },
  {
    name: "Athens",
    latitude: 37.983917, 
    longitude: 23.72936,
    continent: "Europe",
    airportCode: "ATH"
  },
  {
    name: "Bali",
    latitude: -8.696808,
    longitude: 115.208817,
    continent: "Asia",
    airportCode: "DPS"
  },
  {
    name: "Singapore",
    latitude: 1.302755,
    longitude: 103.862686,
    continent: "Asia",
    airportCode: "SIN"
  },
  {
    name: "Colombo",
    latitude: 6.908321,
    longitude: 79.867172,
    continent: "Asia",
    airportCode: "CMD"
  },
  {
    name: "Sydney",
    latitude: -33.923492,
    longitude: 151.225433,
    continent: "Oceania",
    airportCode: "SYD"
  },
  {
    name: "Tokyo",
    latitude: 35.702718,
    longitude: 139.733047,
    continent: "Asia",
    airportCode: "HND"
  },
  {
    name: "Cape Town",
    latitude: -33.931557,
    longitude: 18.467674,
    continent: "Africa",
    airportCode: "CPT"
  },
  {
    name: "Brasilia",
    latitude: -15.837508,
    longitude: -47.872925,
    continent: "SAmerica",
    airportCode: "BSB"
  },
  {
    name: "Muscat",
    latitude: 23.497885, 
    longitude: 58.502197,
    continent: "Asia",
    airportCode: "MCT"
  },
  {
    name: "Addis Ababa",
    latitude: 9.011043,
    longitude: 38.754959,
    continent: "Africa",
    airportCode: "ADD"
  },
  {
    name: "Acapulco",
    latitude: 16.834683, 
    longitude: -99.912071,
    continent: "NAmerica",
    airportCode: "ACA"
  },
  {
    name: "Havana",
    latitude: 23.098523,
    longitude: -82.364502,
    continent: "NAmerica",
    airportCode: "HAV"
  },
  {
    name: "Perth",
    latitude: -31.974626,
    longitude: 115.861816,
    continent: "Oceania",
    airportCode: "PER"
  },
  {
    name: "Cairo",
    latitude: 30.043984,
    longitude: 31.239624,
    continent: "Africa",
    airportCode: "CAI"
  },
  {
    name: "Valencia",
    latitude: 39.470506,
    longitude: -0.376282,
    continent: "Europe",
    airportCode: "VLC"
  },
  {
    name: "Lisbon",
    latitude: 38.708487,
    longitude: -9.181824,
    continent: "Europe",
    airportCode: "LIS"
  },
  {
    name: "Ljubljana",
    latitude: 46.045476,
    longitude: 14.518433,
    continent: "Europe",
    airportCode: "LJU"
  },
  {
    name: "Nairobi",
    latitude: -1.281345,
    longitude: 36.815186,
    continent: "Africa",
    airportCode: "NBO"
  },
  {
    name: "Lima",
    latitude: -12.058879,
    longitude: -77.047119,
    continent: "SAmerica",
    airportCode: "LIM"
  },
  {
    name: "Hanoi",
    latitude: 21.021540,
    longitude: 105.842285,
    continent: "Asia",
    airportCode: "HAN"
  },
  {
    name: "Wellington",
    latitude: -41.296639,
    longitude: 174.825439,
    continent: "Oceania",
    airportCode: "WLG"
  },
  {
    name: "Bangkok",
    latitude: 13.693274,
    longitude: 100.535889,
    continent: "Asia",
    airportCode: "BKK"
  },
  {
    name: "Mubai",
    latitude:19.050273,  
    longitude: 72.899780,
    continent: "Asia",
    airportCode: "BOM"
  },
  {
    name: "Zanzibar",
    latitude: -6.170977, 
    longitude:  39.214325,
    continent: "Africa",
    airportCode: "ZNZ"
  },
  {
    name: "Austin",
    latitude: 30.263645,
    longitude: -97.746048,
    continent: "NAmerica",
    airportCode: "AUS"
  },
  {
    name: "Phoenix",
    latitude: 33.433089,
    longitude: -112.027588,
    continent: "NAmerica",
    airportCode: "PHX"
  },
  {
    name: "Aukland",
    latitude: -36.880856,
    longitude: 174.759521,
    continent: "Oceania",
    airportCode: "AKL"
  },
  {
    name: "Lagos",
    latitude: 6.483843,
    longitude: 3.383789,
    continent: "Africa",
    airportCode: "LOS"
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
    if (err) return console.log(err);
    var counter = 0;
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
            "partly-cloudy-night"
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
            counter++;
            if (cities.length === counter) process.exit();
          });
        })
        .catch(function (err) {
          console.log("error")
        });
    });
  });
}

// 7d929052505467596765674128261338

desc('Crawling cities for sun sun sun.');
task('default', crawlCities);
task("seed", seedCities);