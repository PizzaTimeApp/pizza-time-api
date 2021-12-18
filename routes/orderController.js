const express = require('express');
const app = express();
const router = express.Router();
const models = require("../models");
const jwtUtils = require('../utils/jwt.utils');
const asyncLib = require('async');

// Create Order
router.post('/createOrder',(req, res) =>{
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
      let pizzas = req.body;
      let pizzaIds = [];
      let pizzaQuantities = [];
      for(let i = 0; i < pizzas.length; i++) {
        pizzaIds.push(pizzas[i].idPizza);
        pizzaQuantities.push(pizzas[i].quantity);
      }
      done(null, pizzaIds, pizzas, userFound);
    },
    function (pizzaIds, pizzas, userFound, done) {
      console.log(pizzaIds);
      pizzaNotExist(pizzaIds)
      .then(function(){
        done(null, pizzas, userFound);
      })
      .catch(function (err) {
        return res.status(500).json({ error: "Pizza not exist" });
      });
    },
    function (pizzas, userFound, done) {
      if(userFound){
        models.order.create({
          idUser: userId,
          status: "new", 
        })
        .then(function (newOrder) {
            done(null, newOrder, pizzas);
        })
        .catch( function (err) {
          console.log(err);
            return res.json({'error':'unable to create new order'});
        });
      }else{
        return res.json({'error':'cannot create order'});
      }
    },
    function (newOrder, pizzas, done) {
      let allReservations = [];
      if(newOrder && pizzas) {
        pizzas.forEach((pizza) => {
          models.orderReservation.create({
            idOrder: newOrder.id,
            idPizza: pizza.idPizza,
            quantity: pizza.quantity,
          })
          .then(function (newReservationOrder) {
            allReservations.push(newReservationOrder);
            if(allReservations.length == pizzas.length) {
              done(allReservations, newOrder);
            }
          })
          .catch( function (err) {
            console.log(err);
            return res.json({'error':'unable to create new reservation'});
          });
        })
      } else{
        return res.json({'error':'unable to create new order with reservation(s)'});
      }
    },
  ],
  function(allReservations, newOrder) {
    if (allReservations) {
      newOrder["dataValues"]["totalAmount"];
      console.log(newOrder);
      return res.status(201).json({
        success: true,
        userOrder: newOrder, 
        reservation : allReservations
      });
    }else {
      return res.json({'error':'cannot create order with reservation'});
    }
  });
});

// Verify if pizza entity exist
const pizzaNotExist = function (idPizzas) {
  return new Promise(function (resolve, reject) {
    let pizzaNotFound = false;
    idPizzas.forEach(async (idPizza, index, array) => {
      await models.pizza
        .findOne({
          where: { id: idPizza },
        })
        .then(function (pizzaFound) {
          if (pizzaFound) {
            console.log("pizza found : " + idPizza);
          } else {
            reject();
            console.log("pizza not found : " + idPizza);
            pizzaNotFound = true;
          }
        })
        .catch(function (err) {
          console.log(err);
          console.log("unable to verify pizza");
          pizzaNotFound = true;
        });

      if (index === array.length - 1) {
        resolve(pizzaNotFound);
      }
    });
  });
};

// Get My Orders
router.get('/myOrders',(req,res)=>{
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
      models.order.findAll({
          order:[(order!=null)? order.split(':'): ['createdAt','DESC']],
          limit:(!isNaN(limit))? limit :null,
          offset:(!isNaN(offset))? offset: null,
          where: {idUser : userId},
          include: [{
              model: models.orderReservation,
              attributes: ['id', 'idPizza', 'quantity'],
              include: [{
                model: models.pizza,
                attributes: ['id', 'name', 'price', 'creator', 'content', 'image']
              }]
          }]
        }).then(function (orderReservation) {
          // console.log(orderReservation["order"]["dataValues"]["idUser"]);
          // orderReservation["dataValues"]["orderReservations"].forEach((orderReservations) => {
          //   if(orderReservations.Length > 1) {
          //     orderReservations.forEach((pizza) => {
          //       console.log(pizza);
          //       // console.log(orderReservations["orderReservations"]["pizza"]);
          //     // })
          //     })
          //   } else {
          //     console.log(orderReservations);
          //   } 
          // }
          // });
          if (orderReservation) {
            const request = {
              success:true,
              orderReservation : orderReservation
            }
            return res.status(200).json(request);
          } else {
              res.json({'error':'no order found'});
          }
          }).catch( function (err) {
              console.log(err);
              res.json({'error':'invalid fields'});
          });
      },
    ]
  );
});

// Get Order
router.get("/getMyOrder/:id", (req, res) => {
  const idOrder = req.params.id;
  const headerAuth = req.headers["authorization"];
  const idUser = jwtUtils.getUserId(headerAuth);

  if (idOrder == undefined || idOrder == null || idOrder == "")
    return res.json({ error: " id not defined" });

  if (idUser < 0) {
    return res.status(400).json({ error: "wrong token" });
  }

  models.order
    .findOne({
      where: {
        id: idOrder,
        idUser: idUser
      },
      include: [{
        model: models.orderReservation,
        attributes: ['id', 'idPizza', 'quantity'],
        include: [{
          model: models.pizza,
          attributes: ['id', 'name', 'price', 'creator', 'content', 'image']
        }]
      }]
    })
    .then(function (orderFound) {
      if (orderFound) {
        res.status(200).json({
          success: true,
          order: orderFound,
        });
      } else {
        res.json({ error: "order not found" });
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.json({ error: "unable to verify order" });
    });
});

// Get Order
router.get("/getOrder/:id", (req, res) => {
  const idOrder = req.params.id;
  const headerAuth = req.headers["authorization"];
  const idUser = jwtUtils.getUserId(headerAuth);
  const isAdmin = jwtUtils.getIsAdmin(headerAuth);

  if (idOrder == undefined || idOrder == null || idOrder == "")
    return res.json({ error: " id not defined" });
  if (idUser < 0) {
    return res.status(400).json({ error: "wrong token" });
  }
  if (isAdmin != "admin") {
    return res.status(400).json({ error: "no Admin" });
  }

  models.order
    .findOne({
      where: {
        id: idOrder,
      },
      include: [{
        model: models.orderReservation,
        attributes: ['id', 'idPizza', 'quantity'],
        include: [{
          model: models.pizza,
          attributes: ['id', 'name', 'price', 'creator', 'content', 'image']
        }]
      }]
    })
    .then(function (orderFound) {
      if (orderFound) {
        res.status(200).json({
          success: true,
          order: orderFound,
        });
      } else {
        res.json({ error: "order not found" });
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.json({ error: "unable to verify order" });
    });
});

// Get all Orders
router.get("/getOrders", (req, res) => {
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

  models.order.findAll({
    order:[(order!=null)? order.split(':'): ['id','DESC']],
    limit:(!isNaN(limit))? limit :null,
    offset:(!isNaN(offset))? offset: null,
    include: [{
        model: models.orderReservation,
        attributes: ['id', 'idPizza', 'quantity'],
        include: [{
          model: models.pizza,
          attributes: ['id', 'name', 'price', 'creator', 'content', 'image']
        }]
    }]
  }).then(function (orderReservation) {
    if (orderReservation) {
      const request = {
        success:true,
        orderReservation : orderReservation
      }
      return res.status(200).json(request);
    } else {
        res.json({'error':'no orders founds'});
    }
    }).catch( function (err) {
        console.log(err);
        res.json({'error':'invalid fields'});
    });
});


// Get all User Orders
router.get("/getUserOrders/:id", (req, res) => {
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

  asyncLib.waterfall([
    function (done) {
      models.user
      .findOne({
          attributes: [
          `id`,
          ],
          where: { id: idUser },
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
      models.order.findAll({
        order:[(order!=null)? order.split(':'): ['createdAt','DESC']],
        limit:(!isNaN(limit))? limit :null,
        offset:(!isNaN(offset))? offset: null,
        where: { idUser: idUser },
        include: [{
            model: models.orderReservation,
            attributes: ['id', 'idPizza', 'quantity'],
            include: [{
              model: models.pizza,
              attributes: ['id', 'name', 'price', 'creator', 'content', 'image']
            }]
        }]
      }).then(function (orderReservation) {
        if (orderReservation) {
          const request = {
            success:true,
            orderReservation : orderReservation
          }
          return res.status(200).json(request);
        } else {
            res.json({'error':'user orders not founds'});
        }
        }).catch( function (err) {
            console.log(err);
            res.json({'error':'invalid fields'});
        })
      }
    ])
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