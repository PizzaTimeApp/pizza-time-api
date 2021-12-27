const express = require("express");
const router = express.Router();
const models = require("../models");
const jwtUtils = require("../utils/jwt.utils");
const asyncLib = require("async");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

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
        res.status(200).json({
          success: true,
          pizzas: pizzas,
        });
      } else {
        res.json({ error: "no pizzas found" });
      }
    })
    .catch(function (err) {
      console.log(err);
      res.json({ error: "invalid fields" });
    });
});

//get image Pizza
router.get("/getImagePizza/:image", jwtUtils.verifyToken, function (req, res) {

  const image = req.params.image;
  res.setHeader("Content-Type", "image/*");
  res.sendFile(path.join(__dirname + "/../uploads/imagePizzas", image));
});

//Create Pizza
router.post("/createPizza",jwtUtils.verifyToken, upload.single("image"), (req, res) => {
  const isAdmin = req.isAdmin


  const name = req.body.name;
  const price = req.body.price;
  const image = req.file ? req.file.filename : req.body.image;
  const content = req.body.content;
  var ingredients = req.body.ingredients;

  //without waterfall
  models.pizza
    .findOne({
      where: { name: name },
    })
    .then(async function (pizzaFound) {
      if (pizzaFound) {
        deletePizzaImage(image);
        return res.json({ error: "Pizza already exist" });
      } else {
        ingredients = ingredients.split(",");

        if (await ingredientNotExist(ingredients)) {
          console.log("Ingredient not exist");
          deletePizzaImage(image);
          return res.json({ error: "Ingredient not exist" });
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
                      return res.json({
                        error: "unable to create pizzaIngredient",
                      });
                    });
                });
                return res.status(201).json({
                  success: true,
                  newPizza: newPizza,
                  ingredients: ingredients,
                });
              } else {
                console.log("cannot create newPizza");
                deletePizzaImage(image);
                return res.json({ error: "cannot create newPizza" });
              }
            })
            .catch(function (err) {
              console.log(err);
              deletePizzaImage(image);
              return res.json({ error: "unable to create pizza" });
            });
        }
      }
    })
    .catch(function (err) {
      console.log(err);
      deletePizzaImage(image);
      return res.json({ error: "unable to verify pizza" });
    });
});

//Get Pizza
router.get("/getPizza/:id", jwtUtils.verifyToken, (req, res) => {
  const idPizza = req.params.id;

  if (idPizza == undefined || idPizza == null || idPizza == "")
    return res.json({ error: " id not defined" });


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
        res.status(200).json({
          success: true,
          pizza: pizzaFound,
        });
      } else {
        res.json({ error: "no pizza found" });
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.json({ error: "unable to verify pizza" });
    });
});

// Delete Pizza
router.delete("/deletePizza/:id", jwtUtils.verifyAdminToken, (req, res) => {

  const idPizza = req.params.id;
  asyncLib.waterfall(
    [
      function (done) {
        models.pizza
          .findOne({
            where: { id: idPizza },
          })
          .then(function (pizzaFound) {
            console.log(pizzaFound);
            done(null, pizzaFound);
          })
          .catch(function (err) {
            console.log(err);
            return res.status(500).json({ error: "unable to verify pizza" });
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
              res.status(500).json({ error: "cannot delete pizza" });
            });
        } else {
          return res.status(200).json({ error: "pizza not exist" });
        }
      },
    ],
    function (pizzaFound) {
      if (pizzaFound) {
        deletePizzaImage(pizzaFound.image);
        const request = {
          success: true,
          idPizza: idPizza,
        };
        return res.status(201).json(request);
      } else {
        return res.status(500).json({ error: "cannot delete pizza" });
      }
    }
  );
});

// Update Pizza
router.put("/updatePizza/:id", jwtUtils.verifyAdminToken, (req, res) => {

  const idPizza = req.params.id;
  if (idPizza == "" || idPizza == undefined || idPizza == null) {
    return res.status(400).json({ error: "no id" });
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
            return res.status(500).json({ error: "unable to verify pizza" });
          });
      },
      function (pizzaFound, done) {
        console.log(pizzaFound);
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
              res.status(500).json({ error: "cannot update pizza" });
            });
        } else {
          res.json({ error: "cannot found pizza" });
        }
      },
    ],
    function (pizzaFound) {
      if (pizzaFound) {
        const request = {
          success: true,
          pizzaFound: pizzaFound,
        };
        return res.status(201).json(request);
      } else {
        return res.status(500).json({ error: "cannot update Pizza" });
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

module.exports = router;
