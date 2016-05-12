var express  = require('express');
var router   = express.Router();

// ***** CONTROLLERS ***** //
var usersController           = require('../controllers/users');
var authenticationsController = require('../controllers/authentications');
var citiesController          = require('../controllers/cities');
var favouritesController      = require('../controllers/favourites');

// ***** ROUTES ***** //
router.post('/login', authenticationsController.login);
router.post('/register', authenticationsController.register);

router.route('/users')
  .get(usersController.index);

router.route('/users/:id')
  .get(usersController.show)
  .put(usersController.update)
  .patch(usersController.update)
  .delete(usersController.delete);

router.route("/users/:id/favourites")
  .post(favouritesController.create)

router.route('/cities')
  .get(citiesController.index)


module.exports = router;