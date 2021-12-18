const express = require("express");
const router = express.Router();
const models = require("../models");
const jwtUtils = require("../utils/jwt.utils");
const asyncLib = require("async");

//get all pizzas
router.get("/getPizzas", (req, res) => {
  const headerAuth = req.headers["authorization"];
  const userId = jwtUtils.getUserId(headerAuth);

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }
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

//Create Pizza
router.post("/createPizza", (req, res) => {
  //Getting auth header
  const headerAuth = req.headers["authorization"];
  const isAdmin = jwtUtils.getIsAdmin(headerAuth);
  const userId = jwtUtils.getUserId(headerAuth);

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }

  const name = req.body.name;
  const price = req.body.price;
  const image = req.body.image;
  const content = req.body.content;
  var ingredients = req.body.ingredients;

  //without waterfall
  models.pizza
    .findOne({
      where: { name: name },
    })
    .then(async function (pizzaFound) {
      if (pizzaFound) {
        return res.json({ error: "Pizza already exist" });
      } else {
        ingredients = ingredients.split(",");

        if (await ingredientNotExist(ingredients)) {
          console.log("Ingredient not exist");
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
                return res.json({ error: "cannot create newPizza" });
              }
            })
            .catch(function (err) {
              console.log(err);
              return res.json({ error: "unable to create pizza" });
            });
        }
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.json({ error: "unable to verify pizza" });
    });
});

//get pizza
router.get("/getPizza/:id", (req, res) => {
  const idPizza = req.params.id;
  const headerAuth = req.headers["authorization"];
  const userId = jwtUtils.getUserId(headerAuth);

  if (idPizza == undefined || idPizza == null || idPizza == "")
    return res.json({ error: " id not defined" });

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
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

module.exports = router;
