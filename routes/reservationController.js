const express = require('express');
const app = express();
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
    function (done) {
      models.user
      .findOne({
          attributes: [
          `id`,
          ],
          where: { id: userId },
      })
      .then(function (userFound) {
        if(userFound) {
          done(null, userFound);
        } else {
          return res.status(500).json({ error: "user not exist in DB" });
        }
      })
      .catch(function (err) {
          return res.status(500).json({ error: "unable to verify user" });
      });
    },
    function(userFound, done){
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
          quantity:quantity,
          // orderNumber: 
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



// Get My Reservations
router.get('/myReservation',(req,res)=>{
  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);
  const order = req.query.order;

  // Getting auth header
  const headerAuth = req.headers['authorization'];
  const userId = jwtUtils.getUserId(headerAuth);

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }

  asyncLib.waterfall(
    [
    function (done) {
      models.user
      .findOne({
          attributes: [
          `id`,
          ],
          where: { id: userId },
      })
      .then(function (userFound) {
        if(userFound) {
          done(null, userFound);
        } else {
          return res.status(500).json({ error: "user not exist in DB" });
        }
      })
      .catch(function (err) {
          return res.status(500).json({ error: "unable to verify user" });
      });
    },
    function (userFound) {
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
      },
    ]
  );
});

// Get Reservation
router.get("/getReservation/:id", (req, res) => {
  const idReservation = req.params.id;
  const headerAuth = req.headers["authorization"];
  const userId = jwtUtils.getUserId(headerAuth);

  if (idReservation == undefined || idReservation == null || idReservation == "")
    return res.json({ error: " id not defined" });

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }

  models.reservation
    .findOne({
      where: {
        id: idReservation,
        idUser: userId
      },
    })
    .then(function (reservationFound) {
      if (reservationFound) {
        res.status(200).json({
          success: true,
          reservations: reservationFound,
        });
      } else {
        res.json({ error: "no user reservation found" });
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.json({ error: "unable to verify reservation" });
    });
});

// Get all Reservations
router.get("/getReservations", (req, res) => {
  // Getting auth header
  const headerAuth = req.headers["authorization"];
  const userId = jwtUtils.getUserId(headerAuth);

  const isAdmin = jwtUtils.getIsAdmin(headerAuth);

  if (isAdmin != "admin") {
    return res.status(400).json({ error: "no Admin" });
  }

  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);
  const order = req.query.order;

  models.reservation
    .findAll({
      order: [order != null ? order.split(":") : ["orderNumber", "ASC"]],
      limit: !isNaN(limit) ? limit : null,
      offset: !isNaN(offset) ? offset : null,
    })
    .then(function (reservations) {
      if (reservations) {
        res.status(200).json({
          success: true,
          reservations: reservations,
        });
      } else {
        res.json({ error: "no reservations found" });
      }
    })
    .catch(function (err) {
      console.log(err);
      res.json({ error: "invalid fields" });
    });
});

// Get all User Reservations
router.get("/getUsersReservations/:id", (req, res) => {
  // Getting auth header
  const headerAuth = req.headers["authorization"];
  const idUser = req.params.id;
  const isAdmin = jwtUtils.getIsAdmin(headerAuth);

  if (idUser == undefined || idUser == null || idUser == "")
    return res.json({ error: " id not defined" });


  if (isAdmin != "admin") {
    return res.status(400).json({ error: "no Admin" });
  }

  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);
  const order = req.query.order;

  models.reservation
    .findAll({
      order: [order != null ? order.split(":") : ["orderNumber", "ASC"]],
      limit: !isNaN(limit) ? limit : null,
      offset: !isNaN(offset) ? offset : null,
      where: {
        idUser: idUser,
      }
    })
    .then(function (reservations) {
      if (reservations) {
        res.status(200).json({
          success: true,
          reservations: reservations,
        });
      } else {
        res.json({ error: "no user reservations found" });
      }
    })
    .catch(function (err) {
      console.log(err);
      res.json({ error: "invalid fields" });
    });
});

// User Reservation Delete
router.delete("/deleteMyReservation/:id", (req, res) => {
  // Getting auth header
  const headerAuth = req.headers["authorization"];
  const userId = jwtUtils.getUserId(headerAuth);
  const idReservation = req.params.id;

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }

  asyncLib.waterfall(
    [
      function (done) {
        models.reservation
          .findOne({
            where: { 
              id: idReservation,
              idUser: userId
            },
          })
          .then(function (reservationFound) {
            done(null, reservationFound);
          })
          .catch(function (err) {
            console.log(err);
            return res
              .status(500)
              .json({ error: "unable to verify my reservation" });
          });
      },
      function (reservationFound, done) {
        if (reservationFound) {
          reservationFound
            .destroy({
              where: {
                id: idReservation,
              },
            })
            .then(function (reservationFound) {
              done(reservationFound);
            })
            .catch(function (err) {
              res.status(500).json({ error: "cannot delete my reservation" });
            });
        } else {
          return res.status(200).json({ error: "reservation not exist" });
        }
      },
    ],
    function (reservationFound) {
      if (reservationFound) {
        const request = {
          success: true,
          idReservation: idReservation,
        };
        return res.status(201).json(request);
      } else {
        return res.status(500).json({ error: "cannot delete my reservation" });
      }
    }
  );
});


// User Reservation Delete
router.delete("/deleteReservation/:id", (req, res) => {
  // Getting auth header
  const headerAuth = req.headers["authorization"];
  const isAdmin = jwtUtils.getIsAdmin(headerAuth);

  if (isAdmin != "admin") {
    return res.status(400).json({ error: "no Admin" });
  }

  const idReservation = req.params.id;

  asyncLib.waterfall(
    [
      function (done) {
        models.reservation
          .findOne({
            where: { 
              id: idReservation,
            },
          })
          .then(function (reservationFound) {
            done(null, reservationFound);
          })
          .catch(function (err) {
            console.log(err);
            return res
              .status(500)
              .json({ error: "unable to verify my reservation" });
          });
      },
      function (reservationFound, done) {
        if (reservationFound) {
          reservationFound
            .destroy({
              where: {
                id: idReservation,
              },
            })
            .then(function (reservationFound) {
              done(reservationFound);
            })
            .catch(function (err) {
              res.status(500).json({ error: "cannot delete my reservation" });
            });
        } else {
          return res.status(200).json({ error: "reservation not exist" });
        }
      },
    ],
    function (reservationFound) {
      if (reservationFound) {
        const request = {
          success: true,
          idReservation: idReservation,
        };
        return res.status(201).json(request);
      } else {
        return res.status(500).json({ error: "cannot delete my reservation" });
      }
    }
  );
});

module.exports = router;