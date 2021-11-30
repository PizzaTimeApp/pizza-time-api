const express = require('express');
const router = express.Router();
const models = require("../models");
const jwtUtils = require('../utils/jwt.utils');
const asyncLib = require('async');

//Create Reservation
router.post('/createReservation',(req, res) =>{
  //Getting auth header
  const headerAuth = req.headers['authorization'];
  const userId = jwtUtils.getUserId(headerAuth);
  const pizzaId = req.body.idPizza;
  const quantity = req.body.quantity;

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }
  
  asyncLib.waterfall([
    function(done){
      models.pizza.findOne({
        where: {id: pizzaId}
      })
      .then( function(pizzaFound){
        done(null,pizzaFound)
      })
      .catch( function (err) {
        console.log(err);
          return res.json({'error':'unable to verify pizza'});
      });
    },
    function (pizzaFound, done) {
      if(pizzaFound){
        models.reservation.create({
          idPizza: pizzaId,
          idUser:userId,
          quantity:quantity
        })
        .then(function (newReservation) {
            done(newReservation);
        })
      }else{
        return res.json({'error':'pizza not exist'});
      }
    },
  ],
  function (newReservation) {
    if (newReservation) {
      return res.status(201).json({
        success: true,
        newReservation: newReservation
      });
    }else {
      return res.json({'error':'cannot create reservation'});
    }
  });
});



//get my reservation
router.get('/myReservation',(req,res)=>{
  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);
  const order = req.query.order;

  const headerAuth = req.headers['authorization'];
  const userId = jwtUtils.getUserId(headerAuth);

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }

  models.reservation.findAll({
      order:[(order!=null)? order.split(':'): ['title','ASC']],
      limit:(!isNaN(limit))? limit :null,
      offset:(!isNaN(offset))? offset: null,
      include: [{
          model:models.pizza,
          attributes: ['id','name', 'price','image','content']
      },{
        model:models.user,
        attributes: ['id','username']
    }]
  }).then(function (reservation) {
      if (reservation) {
        const request = {
          success:true,
          reservation : reservation
        }
        return res.status(200).json(request);
      } else {
          res.json({'error':'no reservation found'});
      }
  }).catch( function (err) {
      console.log(err);
      res.json({'error':'invalid fields'});
  });
});
/*
// User Delete
router.delete("/deleteIngredient", (req, res) => {
  // Getting auth header
  var headerAuth = req.headers["authorization"];
  var isAdmin = jwtUtils.getIsAdmin(headerAuth);

  if (isAdmin != "admin") { return res.status(400).json({ 'error': 'no Admin' })}

  var idIngredient = req.body.idIngredient;

  asyncLib.waterfall([
      function (done) {
          models.ingredient.findOne({
              where: { id: idIngredient },
          })
          .then(function (ingredientFound) {
              done(null, ingredientFound);
          })
          .catch(function (err) {
            console.log(err);
              return res.status(500).json({ error: "unable to verify ingredient" });
          });
      },
      function (ingredientFound, done) {
          if (ingredientFound) {
            ingredientFound.destroy({
                where:{
                  id: idIngredient
                }
              })
              .then(function () {
                const request = {
                  success: true,
                  idIngredient: idIngredient,
                }
                done(res.json(request));
              })
              .catch(function (err) {
              res.status(500).json({ error: "cannot delete ingredient" });
              });
          }else {
            return res.status(200).json({ error: "ingredient not exist" });
        }
      },
      ],
      function (ingredientFound) {
          if (ingredientFound) {
              return res.status(201).json(ingredientFound);
          } else {
              return res.status(500).json({ error: "cannot delete ingredient" });
          }
      }
  );
});
*/
module.exports = router;