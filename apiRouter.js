// Imports
var express = require('express');
var userController = require('./routes/userController');

// Router
exports.router = (function(){
    var apiRouter = express.Router();

    //User Routes
    apiRouter.route('/user/register/').post(userController.register);
    apiRouter.route('/user/login/').post(userController.login);
    apiRouter.route('/user/profile/').get(userController.getUserProfile);
    apiRouter.route('/user/profile/').put(userController.updateUserProfile);
    

    return apiRouter;
    
})();