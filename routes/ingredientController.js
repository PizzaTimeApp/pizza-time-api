const express = require('express');
const router = express.Router();
const models = require("../models");
const jwtUtils = require('../utils/jwt.utils');
const asyncLib = require('async');

//Create ingredient
router.post('/createIngredient',(req, res) =>{
  //Getting auth header
  var headerAuth = req.headers['authorization'];
  var isAdmin = jwtUtils.getIsAdmin(headerAuth);
  var name = req.body.name;

  if(isAdmin != 'admin') return res.json({'error':'Not admin user'});
  
  asyncLib.waterfall([
    function(done){
      models.ingredient.findOne({
          where: {name: name}
      })
      .then( function(ingredientFound){
          done(null,ingredientFound)
      })
      .catch( function (err) {
        console.log(err);
          return res.json({'error':'unable to verify ingredient'});
      });
    },
    function (ingredientFound, done) {
      if(ingredientFound){
        return res.json({'error':'ingredient already exist'});
      }else{
        models.ingredient.create({
          name: name
        })
        .then(function (newIngredient) {
            done(newIngredient);
        })
      }
    },
  ], 
  function (newIngredient) {
    if (newIngredient) {
      return res.status(201).json({
        success: true,
        newIngredient: newIngredient
      });
    }else {
      return res.json({'error':'cannot create ingredient'});
    }
  });
});



//get all ingredient
router.get('/getIngredients',(req,res)=>{
  var limit = parseInt(req.query.limit);
  var offset = parseInt(req.query.offset);
  var order = req.query.order;

  models.ingredient.findAll({
    attributes: ["id","name"],
    order:[(order!=null)? order.split(':'): ['title','ASC']],
    limit:(!isNaN(limit))? limit :null,
    offset:(!isNaN(offset))? offset: null
  }).then(function (ingredients) {
    if (ingredients) {
      res.status(200).json({
        success:true,
        ingredients:ingredients
      });
    } else {
        res.json({'error':'no ingredients found'});
    }
  }).catch( function (err) {
    console.log(err);
    res.json({'error':'invalid fields'});
  });
});

module.exports = router;