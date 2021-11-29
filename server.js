// Import 
var express = require('express');
const path = require('path');
var bodyParse =  require('body-parser');
var userController = require('./routes/userController');
var pizzaController = require('./routes/pizzaController');
var ingredientController = require('./routes/ingredientController');
var reservationController = require('./routes/reservationController');


// Initialize Server
var server = express();

// Body Parser Configuration
// server.use(bodyParse.urlencoded({ extended: true}));
// server.use(bodyParse.json);

server.use(express.urlencoded({ extended: true}));
server.use(express.json());
server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

// Configure Routes 
server.get("/", function(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, "./public", "index.html"));
})

// Default Route
server.use('/api/user', userController);
// server.use('/api/pizza', pizzaController);
server.use('/api/ingredient', ingredientController);
// server.use('/api/reservation', reservationController);

server.listen("8100", function() {
    console.log("Server running");
})