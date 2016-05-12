var User = require("../models/user");

function createFavourites(req, res){
  console.log(req.params.id)
  console.log(req.body.city)
  User.findByIdAndUpdate(req.params.id, 
    { $addToSet: { "favourites": req.body.city }},
    { safe: true, upsert: false, new : true },
    function(err, user) {
    if (err) return res.status(500).json({ message: "Something went wrong." });
    return res.status(201).json({user: user })
  })
}

module.exports = {
  create: createFavourites
}