var mongoose = require("mongoose");

var citySchema = mongoose.Schema({
  name: String,
  continent: String,
  latitude: Number,
  longitude: Number,
  sunny: Boolean
});

module.exports = mongoose.model("City", citySchema);
