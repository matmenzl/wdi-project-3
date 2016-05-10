var City = require("../models/city");

function citiesIndex(req, res) {
  City.find(function(err, cities) {
    if (err) return res.status(500).send();
    return res.status(200).json({ cities: cities });
  })
}

module.exports = {
  index: citiesIndex
}