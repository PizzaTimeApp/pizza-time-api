const express = require("express");
const router = express.Router();
const models = require("../models");
const jwtUtils = require("../utils/jwt.utils");
const asyncLib = require("async");
const response = require("../utils/response");

router.post("/createIngredient", jwtUtils.verifyAdminToken, (req, res) => {
  const name = req.body.name.trim();
  if (!name) {
    return res.json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }
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
            return res.status(500).json( response.responseERROR(response.errorType.INGREDIENT.UNABLE_TO_VERIFY) );
          });
      },
      function (ingredientFound, done) {
        if (ingredientFound) {
          return res.json(response.responseERROR(response.errorType.INGREDIENT.EXIST));
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
        return res.json(response.responseERROR(response.errorType.INGREDIENT.CANT_CREATE));
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
      res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
    });
});

//get ingredient
router.get("/getIngredient/:id", jwtUtils.verifyToken, (req, res) => {
  const idIngredient = req.params.id.trim();

  if (!idIngredient ) {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
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
        .status(500)
        .json(response.responseERROR(response.errorType.INGREDIENT.UNABLE_TO_VERIFY));
    });
});

// Delete Ingredient
router.delete("/deleteIngredient/:id", jwtUtils.verifyAdminToken, (req, res) => {
    const idIngredient = req.params.id.trim();

    if(!idIngredient){
      return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
    }

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
                .json(response.responseERROR(response.errorType.INGREDIENT.UNABLE_TO_VERIFY));
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
                return res.status(500).json(response.responseERROR(response.errorType.INGREDIENT.CANT_DELETE));
              });
          } else {
            return res.status(200).json(response.responseERROR(response.errorType.INGREDIENT.NOT_FOUND));
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
            .json(response.responseERROR(response.errorType.INGREDIENT.CANT_DELETE));
        }
      }
    );
  }
);

// Update Ingredient
router.put("/updateIngredient/:id", jwtUtils.verifyAdminToken, (req, res) => {

  const idIngredient = req.params.id.trim();
  const name = req.body.name.trim();

  if (!name || !idIngredient) {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }

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
              .json(response.responseERROR(response.errorType.INGREDIENT.UNABLE_TO_VERIFY));
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
                .json(response.responseERROR(response.errorType.INGREDIENT.CANT_UPDATE));
            });
        } else {
          return res
            .status(402)
            .json(response.responseERROR(response.errorType.INGREDIENT.NOT_FOUND));
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
          .json(response.responseERROR(response.errorType.INGREDIENT.CANT_UPDATE));
      }
    }
  );
});

module.exports = router;
