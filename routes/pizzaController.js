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

  asyncLib.waterfall(
    [
      function (done) {
        models.pizza
          .findOne({
            where: { name: name },
          })
          .then(function (pizzaFound) {
            done(null, pizzaFound);
          })
          .catch(function (err) {
            console.log(err);
            return res.json({ error: "unable to verify pizza" });
          });
      },
      function (pizzaFound, done) {
        if (pizzaFound) {
          return res.json({ error: "Pizza already exist" });
        } else {
          //TODO : Faire un nouveau waterfall pour regarder si tous les ingredients existent
          models.pizza
            .create({
              name: name,
              price: price,
              image: image,
              content: content,
              creator: isAdmin,
            })
            .then(function (newPizza) {
              done(newPizza);
            })
            .catch(function (err) {
              console.log(err);
              return res.json({ error: "unable to create pizza" });
            });
        }
      },
    ],
    async function (newPizza) {
      if (newPizza) {
        ingredients = ingredients.split(",");
        await ingredients.forEach((ingredient) => {
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
              return res.json({ error: "unable to create pizzaIngredient" });
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
    }
  );
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

/*
// Ingredient Delete
router.delete("/deleteIngredient/:id", (req, res) => {
  // Getting auth header
  const headerAuth = req.headers["authorization"];
  const isAdmin = jwtUtils.getIsAdmin(headerAuth);

  if (isAdmin != "admin") {
    return res.status(400).json({ error: "no Admin" });
  }

  const idIngredient = req.params.id;

  asyncLib.waterfall(
    [
      function (done) {
        models.ingredient
          .findOne({
            where: { id: idIngredient },
          })
          .then(function (ingredientFound) {
            done(null, ingredientFound);
          })
          .catch(function (err) {
            console.log(err);
            return res
              .status(500)
              .json({ error: "unable to verify ingredient" });
          });
      },
      function (ingredientFound, done) {
        if (ingredientFound) {
          ingredientFound
            .destroy({
              where: {
                id: idIngredient,
              },
            })
            .then(function (ingredientFound) {
              done(ingredientFound);
            })
            .catch(function (err) {
              res.status(500).json({ error: "cannot delete ingredient" });
            });
        } else {
          return res.status(200).json({ error: "ingredient not exist" });
        }
      },
    ],
    function (ingredientFound) {
      if (ingredientFound) {
        const request = {
          success: true,
          idIngredient: idIngredient,
        };
        return res.status(201).json(request);
      } else {
        return res.status(500).json({ error: "cannot delete ingredient" });
      }
    }
  );
});

// Update INgredient
router.put("/updateIngredient/:id", (req, res) => {
  // Getting auth header
  const headerAuth = req.headers["authorization"];
  const isAdmin = jwtUtils.getIsAdmin(headerAuth);

  if (isAdmin != "admin") {
    return res.status(400).json({ error: "no Admin" });
  }

  const idIngredient = req.params.id;
  const name = req.body.name;

  asyncLib.waterfall(
    [
      function (done) {
        models.ingredient
          .findOne({
            attributes: [`id`, `name`],
            where: { id: idIngredient },
          })
          .then(function (ingredientFound) {
            done(null, ingredientFound);
          })
          .catch(function (err) {
            return res
              .status(500)
              .json({ error: "unable to verify ingredient" });
          });
      },
      function (ingredientFound, done) {
        if (ingredientFound) {
          ingredientFound
            .update({
              name: name ? name : ingredientFound.name,
            })
            .then(function (ingredientFound) {
              done(ingredientFound);
            })
            .catch(function (err) {
              res.status(500).json({ error: "cannot update ingredient" });
            });
        }
      },
    ],
    function (ingredientFound) {
      if (ingredientFound) {
        const request = {
          success: true,
          ingredient: ingredientFound,
        };
        return res.status(201).json(request);
      } else {
        return res.status(500).json({ error: "cannot update Ingredient" });
      }
    }
  );
});
*/
module.exports = router;
