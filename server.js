// Import
const express = require("express");
const cors = require('cors')
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
// const swaggerDocument = require('./swagger.json');
const path = require("path");
const bodyParse = require("body-parser");
const userController = require("./routes/userController");
const pizzaController = require("./routes/pizzaController");
const ingredientController = require("./routes/ingredientController");
const orderController = require("./routes/orderController");
const { ServerResponse } = require("http");

// Initialize Server
const server = express();

// Config Swaggger Api 

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Express API with Swagger",
      version: "0.1.0",
      description:
        "This is a simple CRUD API application made with Express and documented with Swagger",
      contact: {
        name: "Quentin MENDEL",
        url: "https://www.qmendel.fr/",
      },
      // contact: {
      //   name: "Thomas DUBUIS",
      //   url: "",
      // },
    },
    servers: [
      {
        url: "http://localhost:8101",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(cors());

server.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE', 'OPTIONS');
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Headers",
  );
  next();
});

// Configure Routes
server.get("/", function (req, res) {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});

const specs = swaggerJsdoc(options);
server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));


// Default Route
server.use("/api/user", userController);
server.use("/api/pizza", pizzaController);
server.use("/api/ingredient", ingredientController);
server.use("/api/order", orderController);

server.listen("8101", function () {
  console.log("Server running");
});
