var mongoose = require("mongoose");

var citySchema = mongoose.Schema({
  name: String,
  continent: String,
  latitude: Number,
  longitude: Number,
  sunny: Boolean,
  icon: String,
  summary: String,
  airportCode: String
});

module.exports = mongoose.model("City", citySchema);
