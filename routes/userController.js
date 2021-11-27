// Imports
var bcrypt = require('bcrypt');
var jwtUtils = require('../utils/jwt.utils');
var models = require('../models');
var asyncLib = require('async');

//constants
const EMAIL_REGEX = /^(([^<>()[]\.,;:\s@"]+(.[^<>()[]\.,;:\s@"]+))|(".+"))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$/
const PASSWORD_REGEX = /^(?=.\d).{4,8}$/;

// Routes
module.exports = {
    register: function(req, res) {
        // Params
        var email = req.body.email;
        var firstname = req.body.firstname;
        var lastname = req.body.lastname;
        var username = req.body.username;
        var password = req.body.password;
        var gender = req.body.gender;
        var dateOfBirth = req.body.dateOfBirth;
        var phone = req.body.phone;
        var address = req.body.address;
        var city = req.body.city;
        var zip = req.body.zip;

        userForm =  [
            email,
            firstname,
            lastname,
            username,
            password,
            gender,
            dateOfBirth,
            phone,
            address,
            city,
            zip
        ]

        userForm.forEach(el => {      
            if(el == null || el == "") {
                return res.status(400).json({ 'error': 'missing parameters'});
            }
        })

        if(username.length < 3 || username.length >= 17) {
            return res.status(400).json({ 'error': 'wrong username (must be length 3 - 17)' });
        }

        if (!EMAIL_REGEX.test(email)){ return res.json({'error':'email is not valid'}) };
        if(!PASSWORD_REGEX.test(password)){ return res.json({'error':'password invalid (must lenght 4 - 8 and include 1 number at least)'}) }

        // Verify fields
        asyncLib.waterfall([
            function(done){
                models.user.findOne({
                    attributes: ['email'],
                    where: { email: email }
                })
                .then(function(userFound) {
                    done(null, userFound);
                })
                .catch(function(err) {
                    return res.status(500).json({ 'error': 'unable to verify user'});
                });
            },
            function(userFound, done) {
                if(!userFound) {
                    bcrypt.hash(password, 5, function( err, bcryptedPassword ) {
                        done(null, userFound, bcryptedPassword);
                    });
                } else {
                    return res.status('409').json({ 'error': 'user already exist'});
                }
            },
            function(userFound, bcryptedPassword, done) {
                var newUser = models.user.create({
                    email: email,
                    firstname: firstname,
                    lastname: lastname,
                    username: username,
                    password: bcryptedPassword,
                    gender: gender,
                    dateOfBirth: dateOfBirth ,
                    phone: phone,
                    address: address,
                    city: city,
                    zip: zip
                })
                .then(function(newUser) {
                    done(newUser);
                })
                .catch(function(err){
                    return res.status(500).json({ 'error': 'cannot add user'});
                });
            }
        ], function(newUser) {
            if(newUser) {
                return res.status(201).json({
                    'userId': newUser.id
                });
            } else {
                return res.status(500).json({ 'error': 'cannot add user'});
            }
        });
    },

    login: function(req, res) {
        // Params
        var email = req.body.email;
        var password = req.body.password;

        if(email == null  || password == null || email == "" || password == "") {
            return res.status(400).json({ 'error': 'missing parameters'});
        }
        // return res.status(200).json({
        //     'userID': password,
        // })

        models.user.findOne({
            // attributes: [`id`, `email`, `firstname`, `lastname`, `username`, 'password', `idAdmin`, `gender`, `phone`, `address`, `city`, `zip`, `createdAt`, `updatedAt`, `reservationId`, `resetPasswordRequestId`],
            where: {email:email}
        })
        .then(function(userFound){
            if(userFound){
                bcrypt.compare(password,userFound.password, function(errBycrypt,resBycrypt) {
                    if(resBycrypt) {
                        return res.status(200).json({
                            'userID': userFound.id,
                            'token': jwtUtils.generateTokenForUser(userFound)
                        })
                    }else {
                        return res.json({'error':'invalid password'});
                    }
                });
            }else{
                return res.json({'error':'user not exist in DB'});
            }
        }).catch(function(err){
            return res.status(500).json({ 'error': 'unable to verify user'});
        })
    },

    getUserProfile: function(req, res) {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        if(userId < 0 ){
            return res.status(400).json({'error': 'wrong token' });
        } 
        models.user.findOne({
            attributes: [`id`, `email`, `firstname`, `lastname`, `username`, `gender`, `dateOfBirth`, `phone`, `address`, `city`, `zip`, `createdAt`],
            where: { id: userId }
        }).then(function(user) {
            if(user) {
                res.status(201).json(user);
            } else {
                res.status(404).json({ 'error': 'user not found' });
            }
        }).catch(function(err) {
            res.status(500).json({ 'error': 'cannot fetch user' });
        })
    },

    updateUserProfile: function(req, res) {
        // Getting auth header
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);


        // Params
        var email = req.body.email;
        var username = req.body.username;
        var firstname = req.body.firstname;
        var lastname = req.body.lastname;
        var dateOfBirth = req.body.dateOfBirth;
        var gender = req.body.gender;
        var phone = req.body.phone;
        var address = req.body.address;
        var city = req.body.city;
        var zip = req.body.zip;

        if(username.length < 3 || username.length >= 17) {
            return res.status(400).json({ 'error': 'wrong username (must be length 3 - 17)' });
        }

        if(email) {
            if (!EMAIL_REGEX.test(email)){ return res.json({'error':'email is not valid'}) };
        }

        asyncLib.waterfall([
            function(done){
                models.user.findOne({
                    attributes: [`id`, `email`,`firstname`, `lastname`, `dateOfBirth`, `gender`, `username`, `phone`, `address`, `city`, `zip`],
                    where: { id : userId }
                }).then(function(userFound) {
                    done(null, userFound);
                })
                .catch(function(err) {
                    return res.status(500).json({ 'error': 'unable to verify user'});
                });
            },
            function(userFound, done) {
                if(userFound) {    
                    userFound.update({
                        email: (email ? email: userFound.email),
                        username: (username ? username: userFound.username),
                        firstname: (firstname ? firstname: userFound.firstname),
                        lastname: (lastname ? lastname: userFound.lastname),
                        dateOfBirth: (dateOfBirth ? dateOfBirth: userFound.dateOfBirth),
                        gender: (gender ? gender: userFound.gender),
                        phone: (phone ? phone: userFound.phone),
                        address: (address ? address: userFound.address),
                        city: (city ? city: userFound.city),
                        zip: (zip ? zip: userFound.zip)
                    }).then(function() {
                        done(userFound);
                    }).catch(function(err) {
                        console.log(err);
                        res.status(500).json({'error': 'cannot update user' });
                    })
                }
            },
        ], function(userFound) {
            if (userFound) {
                return res.status(201).json(userFound);
            } else {
                return res.status(500).json({ 'error': 'cannot update user profile' });
            }
        });
    }
}