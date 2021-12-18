// Import
const express = require("express");
const path = require("path");
const bodyParse = require("body-parser");
const userController = require("./routes/userController");
const pizzaController = require("./routes/pizzaController");
const ingredientController = require("./routes/ingredientController");
const orderController = require("./routes/orderController");

// Initialize Server
const server = express();

// Body Parser Configuration
// server.use(bodyParse.urlencoded({ extended: true}));
// server.use(bodyParse.json);

server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Configure Routes
server.get("/", function (req, res) {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});

// Default Route
server.use("/api/user", userController);
server.use("/api/pizza", pizzaController);
server.use("/api/ingredient", ingredientController);
server.use("/api/order", orderController);

server.listen("8101", function () {
  console.log("Server running");
});
