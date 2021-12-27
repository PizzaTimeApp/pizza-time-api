const express = require("express");
const router = express.Router();
const models = require("../models");
const jwtUtils = require("../utils/jwt.utils");
const asyncLib = require("async");
const response = require("../utils/response");

//Create ingredient
router.post("/createIngredient", jwtUtils.verifyAdminToken, (req, res) => {
  const name = req.body.name;

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
            return res.json(
              response.responseERROR("Unable to verify ingredient")
            );
          });
      },
      function (ingredientFound, done) {
        if (ingredientFound) {
          return res.json(response.responseERROR("Ingredient already exist"));
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
        return res.status(201).json(
          response.responseOK("", {
            newIngredient: newIngredient,
          })
        );
      } else {
        return res.json(response.responseERROR("Cannot create ingredient"));
      }
    }
  );
});

//get all ingredient
router.get("/getIngredients", jwtUtils.verifyToken, (req, res) => {
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
        return res.status(200).json(
          response.responseOK("", {
            ingredients: ingredients,
          })
        );
      } else {
        res
          .status(200)
          .json(
            response.responseERROR(response.errorType.INGREDIENT.NOT_FOUND)
          );
      }
    })
    .catch(function (err) {
      console.log(err);
      res.status(400).json(response.responseERROR("Invalid fields"));
    });
});

//get ingredient
router.get("/getIngredient/:id", jwtUtils.verifyToken, (req, res) => {
  const idIngredient = req.params.id;

  if (idIngredient == undefined || idIngredient == null || idIngredient == "") {
    return res.status(400).json(response.responseERROR("Id not defined"));
  }

  models.ingredient
    .findOne({
      where: { id: idIngredient },
    })
    .then(function (ingredientFound) {
      if (ingredientFound) {
        return res.status(200).json(
          response.responseOK("", {
            ingredient: ingredientFound,
          })
        );
      } else {
        return res
          .status(400)
          .json(
            response.responseERROR(response.errorType.INGREDIENT.NOT_FOUND)
          );
      }
    })
    .catch(function (err) {
      console.log(err);
      return res
        .status(400)
        .json(response.responseERROR("Unable to verify ingredient"));
    });
});

// Delete Ingredient
router.delete("/deleteIngredient/:id", jwtUtils.verifyAdminToken, (req, res) => {
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
                .json(response.responseERROR("Unable to verify ingredient"));
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
                return res
                  .status(500)
                  .json(response.responseERROR("Cannot delete ingredient"));
              });
          } else {
            return res
              .status(200)
              .json(response.responseERROR("Ingredient not exist"));
          }
        },
      ],
      function (ingredientFound) {
        if (ingredientFound) {
          return res.status(200).json(
            response.responseOK("", {
              idIngredient: idIngredient,
            })
          );
        } else {
          return res
            .status(500)
            .json(response.responseERROR("Cannot delete ingredient"));
        }
      }
    );
  }
);

// Update Ingredient
router.put("/updateIngredient/:id", jwtUtils.verifyAdminToken, (req, res) => {

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
              .json(response.responseERROR("Unable to verify ingredient"));
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
              return res
                .status(500)
                .json(response.responseERROR("Cannot update ingredient"));
            });
        } else {
          return res
            .status(402)
            .json(response.responseERROR("Cannot find ingredient"));
        }
      },
    ],
    function (ingredientFound) {
      if (ingredientFound) {
        return res.status(201).json(
          response.responseOK("", {
            ingredient: ingredientFound,
          })
        );
      } else {
        return res
          .status(500)
          .json(response.responseERROR("Cannot update Ingredient"));
      }
    }
  );
});

module.exports = router;
