const express = require("express");
const router = express.Router();
const models = require("../models");
const jwtUtils = require("../utils/jwt.utils");
const asyncLib = require("async");

//Create ingredient
router.post("/createIngredient", (req, res) => {
  //Getting auth header
  const headerAuth = req.headers["authorization"];
  const isAdmin = jwtUtils.getIsAdmin(headerAuth);
  const name = req.body.name;

  if (isAdmin != "admin") return res.json({ error: "no Admin" });

  asyncLib.waterfall(
    [
      function (done) {
        models.ingredient
          .findOne({
            where: { name: name },
          })
          .then(function (ingredientFound) {
            done(null, ingredientFound);
          })
          .catch(function (err) {
            console.log(err);
            return res.json({ error: "unable to verify ingredient" });
          });
      },
      function (ingredientFound, done) {
        if (ingredientFound) {
          return res.json({ error: "ingredient already exist" });
        } else {
          models.ingredient
            .create({
              name: name,
            })
            .then(function (newIngredient) {
              done(newIngredient);
            });
        }
      },
    ],
    function (newIngredient) {
      if (newIngredient) {
        return res.status(201).json({
          success: true,
          newIngredient: newIngredient,
        });
      } else {
        return res.json({ error: "cannot create ingredient" });
      }
    }
  );
});

//get all ingredient
router.get("/getIngredients", (req, res) => {
  const headerAuth = req.headers["authorization"];
  const userId = jwtUtils.getUserId(headerAuth);

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }
  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);
  const order = req.query.order;

  models.ingredient
    .findAll({
      attributes: ["id", "name"],
      order: [order != null ? order.split(":") : ["title", "ASC"]],
      limit: !isNaN(limit) ? limit : null,
      offset: !isNaN(offset) ? offset : null,
    })
    .then(function (ingredients) {
      if (ingredients) {
        res.status(200).json({
          success: true,
          ingredients: ingredients,
        });
      } else {
        res.json({ error: "no ingredients found" });
      }
    })
    .catch(function (err) {
      console.log(err);
      res.json({ error: "invalid fields" });
    });
});

//get ingredient
router.get("/getIngredient/:id", (req, res) => {
  const idIngredient = req.params.id;
  const headerAuth = req.headers["authorization"];
  const userId = jwtUtils.getUserId(headerAuth);

  if (idIngredient == undefined || idIngredient == null || idIngredient == "")
    return res.json({ error: " id not defined" });

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }

  models.ingredient
    .findOne({
      where: { id: idIngredient },
    })
    .then(function (ingredientFound) {
      if (ingredientFound) {
        res.status(200).json({
          success: true,
          ingredients: ingredientFound,
        });
      } else {
        res.json({ error: "no ingredients found" });
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.json({ error: "unable to verify ingredient" });
    });
});

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
              return res.status(500).json({ error: "cannot update ingredient" });
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

module.exports = router;
