const express = require("express");
const router = express.Router();
const models = require("../models");
const jwtUtils = require("../utils/jwt.utils");
const asyncLib = require("async");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const response = require("../utils/response");

const upload = multer({
  dest: __dirname + "/../uploads/imagePizzas",
  limits: { fileSize: 2000000 },
});

//get all pizzas
router.get("/getPizzas", jwtUtils.verifyToken, (req, res) => {

  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);
  const order = req.query.order;
  const type = req.query.type;

  models.pizza
    .findAll({
      order: [order != null ? order.split(":") : ["name", "ASC"]],
      limit: !isNaN(limit) ? limit : null,
      offset: !isNaN(offset) ? offset : null,
      where: { creator: type },
      include: [
        {
          model: models.ingredient,
          as: "ingredient",
          attributes: ["id", "name"],
        },
      ],
    })
    .then(function (pizzas) {
      if (pizzas) {
        return res.status(200).json(response.responseOK("",{pizzas: pizzas}))
      } else {
      return res.status(400).json(response.responseERROR(response.errorType.PIZZA.NOT_FOUND));
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.status(500).json(response.responseERROR(response.errorType.INVALID_FIELDS));
    });
});

//get image Pizza
router.get("/getImagePizza/:image", function (req, res) {

  const image = req.params.image.trim();
  if (!image) {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }
  res.setHeader("Content-Type", "image/png");
  res.sendFile(path.join(__dirname + "/../uploads/imagePizzas", image));
});

//Create Pizza
router.post("/createPizza",jwtUtils.verifyToken, (req, res) => {
  const isAdmin = req.isAdmin

  const name = req.body.name.trim();
  const price = req.body.price.trim();
  const imageData = req.body.image.trim();
  const content = req.body.content.trim();
  var ingredients = req.body.ingredients;
  const image = createImage(imageData);
  if (!name || !price || !image || !content || !ingredients) {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }
  //without waterfall
  models.pizza
    .findOne({
      where: { name: name },
    })
    .then(async function (pizzaFound) {
      if (pizzaFound) {
        deletePizzaImage(image);
        return res.status(400).json(response.responseERROR(response.errorType.PIZZA.EXIST));
      } else {
        // ingredients = ingredients.split(",");

        if (await ingredientNotExist(ingredients)) {
          console.log("Ingredient not exist");
          deletePizzaImage(image);
          return res.status(400).json(response.responseERROR(response.errorType.INGREDIENT.NOEXIST));
        } else {
          await models.pizza
            .create({
              name: name,
              price: price,
              image: image,
              content: content,
              creator: isAdmin,
            })
            .then(function (newPizza) {
              if (newPizza) {
                ingredients.forEach((ingredient) => {
                  models.pizzaIngredient
                    .create({
                      idPizza: newPizza.id,
                      idIngredient: ingredient,
                    })
                    .then(function (ingredientPizza) {
                      console.log("AjoutIngredient");
                    })
                    .catch(function (err) {
                      console.log(err);
                      deletePizzaImage(image);
                      return res.status(500).json(response.responseERROR(response.errorType.PIZZA_INGREDIENT.CANT_CREATE));
                    });
                });
                return res.status(201).json(response.responseOK("", {newPizza: newPizza, ingredients: ingredients}))
              } else {
                deletePizzaImage(image);
                return res.status(500).json(response.responseERROR(response.errorType.PIZZA.CANT_CREATE));
              }
            })
            .catch(function (err) {
              console.log(err);
              deletePizzaImage(image);
              return res.status(500).json(response.responseERROR(response.errorType.PIZZA.CANT_CREATE));
            });
        }
      }
    })
    .catch(function (err) {
      console.log(err);
      deletePizzaImage(image);
      return res.status(500).json(response.responseERROR(response.errorType.PIZZA.UNABLE_TO_VERIFY));
    });
});

//Get Pizza
router.get("/getPizza/:id", jwtUtils.verifyToken, (req, res) => {
  const idPizza = req.params.id.trim();

  if (!idPizza){
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }
  
  models.pizza
    .findOne({
      where: { id: idPizza },
      include: [
        {
          model: models.ingredient,
          as: "ingredient",
          attributes: ["id", "name"],
        },
      ],
    })
    .then(function (pizzaFound) {
      if (pizzaFound) {
        return res.status(200).json(response.responseOK("", {pizza: pizzaFound}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.PIZZA.NOT_FOUND));
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.status(500).json(response.responseERROR(response.errorType.PIZZA.UNABLE_TO_VERIFY));
    });
});

// Delete Pizza
router.delete("/deletePizza/:id", jwtUtils.verifyAdminToken, (req, res) => {

  const idPizza = req.params.id.trim();

  if(!idPizza){
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }

  asyncLib.waterfall(
    [
      function (done) {
        models.pizza
          .findOne({
            where: { id: idPizza },
          })
          .then(function (pizzaFound) {
            done(null, pizzaFound);
          })
          .catch(function (err) {
            console.log(err);
            return res.status(500).json(response.responseERROR(response.errorType.PIZZA.UNABLE_TO_VERIFY));
          });
      },
      function (pizzaFound, done) {
        if (pizzaFound) {
          pizzaFound
            .destroy({
              where: {
                id: idPizza,
              },
            })
            .then(function (pizzaFound) {
              done(pizzaFound);
            })
            .catch(function (err) {
              return res.status(500).json(response.responseERROR(response.errorType.PIZZA.CANT_DELETE));
            });
        } else {
          return res.status(400).json(response.responseERROR(response.errorType.PIZZA.NOEXIST));
        }
      },
    ],
    function (pizzaFound) {
      if (pizzaFound) {
        deletePizzaImage(pizzaFound.image);
        return res.status(201).json(response.responseOK("", {idPizza: idPizza}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.PIZZA.CANT_DELETE));
      }
    }
  );
});

// Update Pizza
router.put("/updatePizza/:id", jwtUtils.verifyAdminToken, (req, res) => {

  const idPizza = req.params.id.trim();
  if (!idPizza) {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }
  const name = req.body.name;
  const price = req.body.price;
  const content = req.body.content;
  const image = req.body.image;

  asyncLib.waterfall(
    [
      function (done) {
        models.pizza
          .findOne({
            attributes: [`id`, `name`, `price`, `content`, `image`],
            where: { id: idPizza },
          })
          .then(function (pizzaFound) {
            done(null, pizzaFound);
          })
          .catch(function (err) {
          return res.status(500).json(response.responseERROR(response.errorType.PIZZA.UNABLE_TO_VERIFY));
          });
      },
      function (pizzaFound, done) {
        if (pizzaFound) {
          pizzaFound
            .update({
              name: name ? name : pizzaFound.name,
              price: price ? price : pizzaFound.price,
              content: content ? content : pizzaFound.content,
              image: image ? image : pizzaFound.image,
            })
            .then(function (pizzaFound) {
              done(pizzaFound);
            })
            .catch(function (err) {
              return res.status(500).json(response.responseERROR(response.errorType.PIZZA.CANT_UPDATE));
            });
        } else {
          return res.status(500).json(response.responseERROR(response.errorType.PIZZA.NOT_FOUND));
        }
      },
    ],
    function (pizzaFound) {
      if (pizzaFound) {
        return res.status(201).json(response.responseOK("", {pizza: pizzaFound}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.PIZZA.CANT_UPDATE));
      }
    }
  );
});

const ingredientNotExist = function (idIngredients) {
  return new Promise(function (resolve, reject) {
    let ingredientNotFound = false;
    idIngredients.forEach(async (idIngredient, index, array) => {
      await models.ingredient
        .findOne({
          where: { id: idIngredient },
        })
        .then(function (IngredientFound) {
          if (IngredientFound) {
            console.log("ingredient found : " + idIngredient);
          } else {
            console.log("ingredient not found : " + idIngredient);
            ingredientNotFound = true;
          }
        })
        .catch(function (err) {
          console.log(err);
          console.log("unable to verify ingredient");
          ingredientNotFound = true;
        });

      if (index === array.length - 1) {
        resolve(ingredientNotFound);
      }
    });
  });
};

const deletePizzaImage = function (fileName) {
  fs.unlink(__dirname + "/../uploads/imagePizzas/" + fileName, function (err) {
    if (err) {
      console.log("File Not exist : " + fileName);
    } else {
      console.log("File deleted! : " + fileName);
    }
  });
};
const createImage = function(image) {

  // Remove header
  let base64Image = image.split(';base64,').pop();
  let name = Math.random().toString(16).substr(2, 8) + '.png';
  fs.writeFile(__dirname + "/../uploads/imagePizzas/" + name, base64Image, {encoding: 'base64'}, function(err) {
    console.log('PizzaImage created');
    if (err) {
      console.log('Erreur creation de PizzaImage');
      console.log(err);
    }
  });
  return name;
}
module.exports = router;
