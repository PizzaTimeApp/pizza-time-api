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
  async function(allReservations, newOrder) {
    let order = await getTotalAmount(allReservations, newOrder, false);
    console.log(order);
    if (allReservations) {
      return res.status(201).json({
        success: true,
        userOrder: order, 
        reservation : allReservations
      });
    }else {
      return res.json({'error':'cannot create order with reservation'});
    }
  });
});

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
        }).then(async function (orderReservation) {
          if (orderReservation) {
            await getTotalAmount(orderReservation,null, true);
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
    .then(async function (orderFound) {
      if (orderFound) {
        await getTotalAmount(orderFound, null, true);
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
    .then(async function (orderFound) {
      if (orderFound) {
        await getTotalAmount(orderFound, null, true);
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
  }).then(async function (orderReservation) {
    if (orderReservation) {
      await getTotalAmount(orderReservation, null, true);
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
      }).then(async function (orderReservation) {
        if (orderReservation) {
          await getTotalAmount(orderReservation, null, true);
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

// Update Order 
router.put("/updateOrder/:id", (req, res) => {
  // Getting auth header
  const headerAuth = req.headers["authorization"];
  const userId = jwtUtils.getUserId(headerAuth);
  // const isAdmin = jwtUtils.getIsAdmin(headerAuth);

  // if (isAdmin != "admin") {
  //   return res.status(400).json({ error: "no Admin" });
  // }

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }

  const idOrder = req.params.id;
  if (idOrder == "" || idOrder == undefined || idOrder == null) {
    return res.status(400).json({ error: "no id" });
  }
  const status = req.body.status;

  let allStatus = ['new', 'pending payment', 'processing', 'complete', 'closed', 'canceled'];

  console.log(status);
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
            return res.status(500).json({ error: "unable to verify order" });
          });
      },
      function (orderFound, done) {
        if (allStatus.includes(status) == true) {  
            done(null, orderFound);
        } else {
          res.json({ error: "invalid status order" });
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
              res.status(500).json({ error: "cannot update order status" });
            });
        } else {
          res.json({ error: "cannot found order" });
        }
      },
    ],
    function (orderFound) {
      if (orderFound) {
        const request = {
          success: true,
          orderFound: orderFound,
        };
        return res.status(201).json(request);
      } else {
        return res.status(500).json({ error: "cannot update order" });
      }
    }
  );
});

// User Reservation Delete
router.delete("/deleteMyOrder/:id", (req, res) => {
  // Getting auth header
  const headerAuth = req.headers["authorization"];
  const userId = jwtUtils.getUserId(headerAuth);
  const idOrder = req.params.id;

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }

  asyncLib.waterfall(
    [
      function (done) {
        models.order
          .findOne({
            where: { 
              id: idOrder,
              idUser: userId
            },
          })
          .then(function (orderFound) {
            done(null, orderFound);
          })
          .catch(function (err) {
            console.log(err);
            return res
              .status(500)
              .json({ error: "unable to verify my order" });
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
              res.status(500).json({ error: "cannot delete my order" });
            });
        } else {
          return res.status(200).json({ error: "order not exist" });
        }
      },
    ],
    function (orderFound) {
      if (orderFound) {
        const request = {
          success: true,
          idOrder: idOrder,
        };
        return res.status(201).json(request);
      } else {
        return res.status(500).json({ error: "cannot delete my order" });
      }
    }
  );
});


// User Reservation Delete
router.delete("/deleteOrder/:id", (req, res) => {
  // Getting auth header
  const headerAuth = req.headers["authorization"];
  const isAdmin = jwtUtils.getIsAdmin(headerAuth);

  if (isAdmin != "admin") {
    return res.status(400).json({ error: "no Admin" });
  }

  const idOrder = req.params.id;

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
            return res
              .status(500)
              .json({ error: "unable to verify order" });
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
              res.status(500).json({ error: "cannot delete order" });
            });
        } else {
          return res.status(200).json({ error: "order not exist" });
        }
      },
    ],
    function (orderFound) {
      if (orderFound) {
        const request = {
          success: true,
          idOrder: idOrder,
        };
        return res.status(201).json(request);
      } else {
        return res.status(500).json({ error: "cannot delete order" });
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
        console.log(reservation);
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
        let orderReservations = allReservations.orderReservations;
        orderReservations.forEach(async (orderReservation) => {
          let quantity = orderReservation.quantity;
          let price = orderReservation.pizza.price;
          totalAmount += (price * quantity);
          allReservations.dataValues.totalAmount = totalAmount;
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


