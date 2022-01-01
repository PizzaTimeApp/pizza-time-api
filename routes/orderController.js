const express = require('express');
const router = express.Router();
const models = require("../models");
const jwtUtils = require('../utils/jwt.utils');
const asyncLib = require('async');
const response = require("../utils/response");

// Create Order
router.post('/createOrder', jwtUtils.verifyToken, (req, res) =>{
  //Getting auth header
  const idUser = req.idUser;
  const pizzas = req.body
  if (!pizzas) {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }
  
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
          return res.status(500).json(response.responseERROR(response.errorType.USER.NOEXIST));
        }
      })
      .catch(function (err) {
        console.log(err);
        return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
      });
    },
    function(userFound, done){
      let pizzaIds = [];
      let pizzaQuantities = [];
      for(let i = 0; i < pizzas.length; i++) {
        pizzaIds.push(pizzas[i].idPizza);
        pizzaQuantities.push(pizzas[i].quantity);
      }
      done(null, pizzaIds, pizzas, userFound);
    },
    function (pizzaIds, pizzas, userFound, done) {
      pizzaNotExist(pizzaIds)
      .then(function(){
        done(null, pizzas, userFound);
      })
      .catch(function (err) {
        return res.status(500).json(response.responseERROR(response.errorType.PIZZA.NOEXIST));
      });
    },
    function (pizzas, userFound, done) {
      if(userFound){
        models.order.create({
          idUser: idUser,
          status: "new", 
        })
        .then(function (newOrder) {
            done(null, newOrder, pizzas);
        })
        .catch( function (err) {
          console.log(err);
        return res.status(500).json(response.responseERROR(response.errorType.ORDER.CANT_CREATE));
        });
      }else{
        return res.status(500).json(response.responseERROR(response.errorType.ORDER.CANT_CREATE));
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
            return res.status(500).json(response.responseERROR(response.errorType.RESERVATION.CANT_CREATE));
          });
        })
      } else{
        return res.status(500).json(response.responseERROR(response.errorType.RESERVATION.CANT_CREATE));
      }
    },
  ],
  async function(allReservations, newOrder) {
    let order = await getTotalAmount(allReservations, newOrder, false);
    if (allReservations) {
      return res.status(201).json({
        success: true,
        userOrder: order, 
        reservation : allReservations
      });
    }else {
      console.log('cannot create order with reservation');
      return res.status(500).json(response.responseERROR(response.errorType.RESERVATION.CANT_CREATE));
    }
  });
});

// Get My Orders
router.get('/myOrders', jwtUtils.verifyToken, (req,res)=>{
  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);
  const order = req.query.order;

  const idUser = req.idUser;

  asyncLib.waterfall(
    [
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
        return res.status(400).json(response.responseERROR(response.errorType.USER.NOEXIST));
        }
      })
      .catch(function (err) {
        return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
      });
    },
    function (userFound) {
      models.order.findAll({
          order:[(order!=null)? order.split(':'): ['createdAt','DESC']],
          limit:(!isNaN(limit))? limit :null,
          offset:(!isNaN(offset))? offset: null,
          where: {idUser : idUser},
          include: [{
              model: models.orderReservation,
              attributes: ['id', 'idPizza', 'quantity'],
              include: [{
                model: models.pizza,
                attributes: ['id', 'name', 'price', 'creator', 'content', 'image']
              }]
          }]
        }).then(async function (orderReservation) {
          if (orderReservation) {
            await getTotalAmount(orderReservation,null, true);
            return res.status(200).json(response.responseOK("", {orderReservation: orderReservation}));
          } else {
            return res.status(400).json(response.responseERROR(response.errorType.ORDER.NOT_FOUND));
          }
          }).catch( function (err) {
              console.log(err);
              return res.status(500).json(response.responseERROR(response.errorType.INVALID_FIELDS));
          });
      },
    ]
  );
});

// Get Order
router.get("/getMyOrder/:id", jwtUtils.verifyToken, (req, res) => {
  const idOrder = req.params.id.trim();
  const idUser = req.idUser;

  if (!idOrder){
    return res.status(500).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }
  
  models.order
    .findAll({
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
    .then(async function (orderFound) {
      if (orderFound) {
        await getTotalAmount(orderFound, null, true);
        return res.status(200).json(response.responseOK("", {order: orderFound}));
      } else {
        return res.status(400).json(response.responseERROR(response.errorType.ORDER.NOT_FOUND));
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.status(500).json(response.responseERROR(response.errorType.ORDER.UNABLE_TO_VERIFY));
    });
});

// Get Order
router.get("/getOrder/:id", jwtUtils.verifyAdminToken, (req, res) => {
  const idOrder = req.params.id.trim();

  if (!idOrder){
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
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
    .then(async function (orderFound) {
      if (orderFound) {
        await getTotalAmount(orderFound, null, true);
        return res.status(200).json(response.responseOK("", {order: orderFound}));
      } else {
        return res.status(400).json(response.responseERROR(response.errorType.ORDER.NOT_FOUND));
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.status(500).json(response.responseERROR(response.errorType.ORDER.UNABLE_TO_VERIFY));
    });
});

// Get all Orders
router.get("/getOrders", jwtUtils.verifyAdminToken,(req, res) => {

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
  }).then(async function (orderReservation) {
    if (orderReservation) {
      await getTotalAmount(orderReservation, null, true);
      const request = {
        success:true,
        orderReservation : orderReservation
      }
      return res.status(200).json(request);
    } else {
      return res.status(400).json(response.responseERROR(response.errorType.ORDER.NOT_FOUND));
    }
    }).catch( function (err) {
        console.log(err);
        return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
    });
});


// Get all User Orders
router.get("/getUserOrders/:id", jwtUtils.verifyAdminToken, (req, res) => {
  const idUser = req.params.id.trim();

  if (!idUser){
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
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
        return res.status(400).json(response.responseERROR(response.errorType.USER.NOEXIST));
        }
      })
      .catch(function (err) {
        return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
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
      }).then(async function (orderReservation) {
        if (orderReservation) {
          await getTotalAmount(orderReservation, null, true);
          return res.status(200).json(response.responseOK("", {orderReservation: orderReservation}));
        } else {
          return res.status(400).json(response.responseERROR(response.errorType.ORDER.NOT_FOUND));
        }
        }).catch( function (err) {
            console.log(err);
          return res.status(500).json(response.responseERROR(response.errorType.INVALID_FIELDS));
        })
      }
    ])
});

// Update Order 
router.put("/updateOrder/:id", jwtUtils.verifyToken, (req, res) => {

  const idOrder = req.params.id.trim();
  if (!idOrder) {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }
  const status = req.body.status;

  let allStatus = ['new', 'pending payment', 'processing', 'complete', 'closed', 'canceled'];

  asyncLib.waterfall(
    [
      function (done) {
        models.order
          .findOne({
            where: { id: idOrder },
          })
          .then(function (orderFound) {
            done(null, orderFound);
          })
          .catch(function (err) {
            return res.status(500).json(response.responseERROR(response.errorType.ORDER.UNABLE_TO_VERIFY));
          });
      },
      function (orderFound, done) {
        if (allStatus.includes(status) == true) {  
            done(null, orderFound);
        } else {
          return res.status(400).json(response.responseERROR(response.errorType.ORDER.INVALID_STATUS));
        }
      },
      function (orderFound, done) {
        if (orderFound) {
          orderFound
            .update({
              status: status ? status : orderFound.status
            })
            .then(function (orderFound) {
              done(orderFound);
            })
            .catch(function (err) {
            return res.status(500).json(response.responseERROR(response.errorType.ORDER.CANT_UPDATE_STATUS));
            });
        } else {
          return res.status(400).json(response.responseERROR(response.errorType.ORDER.NOT_FOUND));
        }
      },
    ],
    function (orderFound) {
      if (orderFound) {
        return res.status(201).json(response.responseOK("", {order: orderFound}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.ORDER.CANT_UPDATE_STATUS));
      }
    }
  );
});

// User Reservation Delete
router.delete("/deleteMyOrder/:id", jwtUtils.verifyToken, (req, res) => {
  const idUser = req.idUser;
  const idOrder = req.params.id.trim();

  if (!idOrder) {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS)); 
  }

  asyncLib.waterfall(
    [
      function (done) {
        models.order
          .findOne({
            where: { 
              id: idOrder,
              idUser: idUser
            },
          })
          .then(function (orderFound) {
            done(null, orderFound);
          })
          .catch(function (err) {
            console.log(err);
            return res.status(500).json(response.responseERROR(response.errorType.ORDER.UNABLE_TO_VERIFY));
          });
      },
      function (orderFound, done) {
        if (orderFound) {
          orderFound
            .destroy({
              where: {
                id: idOrder,
              },
            })
            .then(function (orderFound) {
              done(orderFound);
            })
            .catch(function (err) {
            return res.status(500).json(response.responseERROR(response.errorType.ORDER.CANT_DELETE));
            });
        } else {
          return res.status(400).json(response.responseERROR(response.errorType.ORDER.NOEXIST));
        }
      },
    ],
    function (orderFound) {
      if (orderFound) {
        return res.status(200).json(response.responseOK("", {idOrder: idOrder}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.ORDER.CANT_DELETE));
      }
    }
  );
});

// User Reservation Delete
router.delete("/deleteOrder/:id", jwtUtils.verifyAdminToken, (req, res) => {

  const idOrder = req.params.id.trim();

  if (!idOrder) {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }

  asyncLib.waterfall(
    [
      function (done) {
        models.order
          .findOne({
            where: { 
              id: idOrder,
            },
          })
          .then(function (orderFound) {
            done(null, orderFound);
          })
          .catch(function (err) {
            console.log(err);
            return res.status(500).json(response.responseERROR(response.errorType.ORDER.UNABLE_TO_VERIFY));
          });
      },
      function (orderFound, done) {
        if (orderFound) {
          orderFound
            .destroy({
              where: {
                id: idOrder,
              },
            })
            .then(function (orderFound) {
              done(orderFound);
            })
            .catch(function (err) {
            return res.status(500).json(response.responseERROR(response.errorType.ORDER.CANT_DELETE));
            });
        } else {
          return res.status(400).json(response.responseERROR(response.errorType.ORDER.NOEXIST));
        }
      },
    ],
    function (orderFound) {
      if (orderFound) {
        return res.status(200).json(response.responseOK("", {idOrder: idOrder}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.ORDER.CANT_DELETE));
      }
    }
  );
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

// Verify if pizza entity exist
const getTotalAmount = function (allReservations, newOrder = null, isGet) {
  return new Promise(function (resolve, reject) {
    if(isGet == false) {
      let totalAmount = 0;
      let i = 0;
      allReservations.forEach(async (reservation) => {
        let idPizza = reservation.idPizza;
        let quantity = reservation.quantity;
        await models.pizza
          .findOne({
            where: { id: idPizza },
          })
          .then(function (pizzaFound) {
            if (pizzaFound) {
              totalAmount += (pizzaFound.price * quantity);
            } else {
              reject();
              console.log("pizza not found : " + idPizza);
              totalAmount = null;
            }
          })
          .catch(function (err) {
            console.log(err);
            console.log("unable to verify pizza");
          });
          i++;
        if (i >= allReservations.length) {
          newOrder.dataValues.totalAmount = totalAmount;
          resolve(newOrder);
        }
      });
    } else {
      let totalAmount = 0;
      let x = 0;
      if (allReservations.length > 1) {
        allReservations.forEach(async (reservation) => {
          let orderReservations = reservation.orderReservations;
          orderReservations.forEach(async (orderReservation) => {
            let quantity = orderReservation.quantity;
            let price = orderReservation.pizza.price;
            totalAmount += (price * quantity);
            reservation.dataValues.totalAmount = totalAmount;
            x++;
            if (x >= orderReservations.length) {
              totalAmount = 0;
              resolve();
            }
          })
        });
      } else {
        let orderReservations = allReservations[0].orderReservations;
        orderReservations.forEach(async (orderReservation) => {
          let quantity = orderReservation.dataValues.quantity;
          let price = orderReservation.dataValues.pizza.price;
          totalAmount += (price * quantity);
          allReservations[0].dataValues.totalAmount = totalAmount;
          x++;
          if (x >= orderReservations.length) {
            totalAmount = 0;
            resolve();
          }
        });
      }
    } 
  });
};

module.exports = router;


