const express = require('express');
const router = express.Router();
const models = require("../models");
const jwtUtils = require('../utils/jwt.utils');
const asyncLib = require('async');

//Create ingredient
router.post('/createIngredient',(req, res) =>{
    //Getting auth header
    var headerAuth = req.headers['authorization'];
    var isAdmin = jwtUtils.getIsAdmin(headerAuth)
    var name = req.body.name;
    
    if(isAdmin != 'Admin') return res.json({'error':'No admin user'})

    models.ingredient.create({
        name:name
    })
    .then(function (newIngredient) {
        if (newDessin) {
            return res.status(201).json(newIngredient);
        }else {
            return res.json({'error':'cannot create ingredient'});
        }
    });

});
/*
//get all dessin
router.get('/getDessins',(req,res)=>{
    var fields = req.query.fields;
    var limit = parseInt(req.query.limit);
    var offset = parseInt(req.query.offset);
    var order = req.query.order;

    db.Dessin.findAll({
        order:[(order!=null)? order.split(':'): ['title','ASC']],
        attributes: (fields !=='*' && fields != null) ? fields.split(',') : null,
        limit:(!isNaN(limit))? limit :null,
        offset:(!isNaN(offset))? offset: null,
        include: [{
            model:db.User,
            attributes: ['id','first_name', 'last_name']
        }]
    }).then(function (dessins) {
        if (dessins) {
            res.status(200).json(dessins);
        } else {
            res.json({'error':'no dessins found'});
        }
    }).catch( function (err) {
        console.log(err);
        res.json({'error':'invalid fields'});
    });
});
*/
module.exports = router;