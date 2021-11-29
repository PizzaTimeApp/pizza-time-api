// Imports
const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const jwtUtils = require("../utils/jwt.utils");
const models = require("../models");
const asyncLib = require("async");

//constants
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX = /^(?=.*\d).{4,30}$/;
const ZIP_REGEX = /^\d{5}$/;
const GENDER_REGEX = /^(male|female)$/;
const DATEOFBIRTH_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_REGEX = /^\d*$/;

// User Register
router.post("/register", (req, res) => {
  // Params
  var email = req.body.email;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  var gender = req.body.gender;
  var dateOfBirth = req.body.dateOfBirth;
  var phone = req.body.phone;
  var address = req.body.address;
  var city = req.body.city;
  var zip = req.body.zip;

  userForm = [
    email,
    firstname,
    lastname,
    username,
    password,
    confirmPassword,
    gender,
    dateOfBirth,
    phone,
    address,
    city,
    zip,
  ];

  userForm.forEach((el) => {
    if (el == null || el == "") {
      return res.status(400).json({ error: "missing parameters" });
    }
  });

  // Conditions & Validations
  if (username.length < 3 || username.length >= 17) {
    return res
      .status(400)
      .json({ error: "wrong username (must be length 3 - 17)" });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "email is not valid" });
  }
  if (!PASSWORD_REGEX.test(password)) {
    return res
      .status(400)
      .json({
        error:
          "password invalid (must lenght 4 - 30 and include 1 number at least)",
      });
  }
  if (confirmPassword !== password) {
    return res.status(400).json({ error: "passwords must match" });
  }
  if (!GENDER_REGEX.test(gender)) {
    return res.status(400).json({ error: "gender is not valid" });
  }
  if (!ZIP_REGEX.test(zip)) {
    return res
      .status(400)
      .json({ error: "zip is not valid, must be 5 numbers" });
  }
  if (!DATEOFBIRTH_REGEX.test(dateOfBirth)) {
    return res
      .status(400)
      .json({ error: "date of birth is not valid, format YYYY-MM-DD" });
  }
  if (!PHONE_REGEX.test(phone)) {
    return res
      .status(400)
      .json({ error: "phone is not valid, only number accepted" });
  }

  // Verify fields
  asyncLib.waterfall(
    [
      function (done) {
        models.user
          .findOne({
            attributes: ["email"],
            where: { email: email },
          })
          .then(function (userFound) {
            done(null, userFound);
          })
          .catch(function (err) {
            return res.status(500).json({ error: "unable to verify user" });
          });
      },
      function (userFound, done) {
        if (!userFound) {
          bcrypt.hash(password, 5, function (err, bcryptedPassword) {
            done(null, userFound, bcryptedPassword);
          });
        } else {
          return res.status("409").json({ error: "user already exist" });
        }
      },
      function (userFound, bcryptedPassword, done) {
        var newUser = models.user
          .create({
            email: email,
            firstname: firstname,
            lastname: lastname,
            username: username,
            password: bcryptedPassword,
            gender: gender,
            dateOfBirth: dateOfBirth,
            phone: phone,
            address: address,
            city: city,
            zip: zip,
          })
          .then(function (newUser) {
            done(newUser);
          })
          .catch(function (err) {
            return res.status(500).json({ error: "cannot add user" });
          });
      },
    ],
    function (newUser) {
      if (newUser) {
        return res.status(201).json({
          success: true,
          userId: newUser.id,
        });
      } else {
        return res.status(500).json({ error: "cannot add user" });
      }
    }
  );
});

// User Login
router.post("/login", (req, res) => {
  // Params
  var email = req.body.email;
  var password = req.body.password;

  if (email == null || password == null || email == "" || password == "") {
    return res.status(400).json({ error: "missing parameters" });
  }

  models.user
    .findOne({
      where: { email: email },
    })
    .then(function (userFound) {
      if (userFound) {
        bcrypt.compare(
          password,
          userFound.password,
          function (errBycrypt, resBycrypt) {
            if (resBycrypt) {
              return res.status(200).json({
                success: true,
                userID: userFound.id,
                token: jwtUtils.generateTokenForUser(userFound),
              });
            } else {
              return res.json({ error: "invalid password" });
            }
          }
        );
      } else {
        return res.json({ error: "user not exist in DB" });
      }
    })
    .catch(function (err) {
      return res.status(500).json({ error: "unable to verify user" });
    });
});

// User Profile
router.get("/profile", (req, res) => {
  var headerAuth = req.headers["authorization"];
  var userId = jwtUtils.getUserId(headerAuth);

  if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
  }
  models.user
    .findOne({
      attributes: [
        `id`,
        `email`,
        `firstname`,
        `lastname`,
        `username`,
        `gender`,
        `dateOfBirth`,
        `phone`,
        `address`,
        `city`,
        `zip`,
        `createdAt`,
      ],
      where: { id: userId },
    })
    .then(function (user) {
      if (user) {
        res.status(201).json({
          success: true,
          user: user
        });
      } else {
        res.status(404).json({ error: "user not found" });
      }
    })
    .catch(function (err) {
      res.status(500).json({ error: "cannot fetch user" });
    });
}),
  
// User Update Profile
router.put("/profile", (req, res) => {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
    }

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

    if (username.length < 3 || username.length >= 17) {
        return res
        .status(400)
        .json({ error: "wrong username (must be length 3 - 17)" });
    }
    if (email) {
        if (!EMAIL_REGEX.test(email)) {
        return res.json({ error: "email is not valid" });
        }
    }
    if (gender) {
        if (!GENDER_REGEX.test(gender)) {
        return res.json({ error: "gender is not valid" });
        }
    }
    if (zip) {
        if (!ZIP_REGEX.test(zip)) {
        return res.json({ error: "zip is not valid, must be 5 numbers" });
        }
    }
    if (dateOfBirth) {
        if (!DATEOFBIRTH_REGEX.test(dateOfBirth)) {
        return res.json({
            error: "date of birth is not valid, format YYYY-MM-DD",
        });
        }
    }
    if (phone) {
        if (!PHONE_REGEX.test(phone)) {
        return res.json({ error: "phone is not valid, only number accepted" });
        }
    }

    asyncLib.waterfall(
        [
        function (done) {
            models.user
            .findOne({
                attributes: [
                `id`,
                `email`,
                `firstname`,
                `lastname`,
                `dateOfBirth`,
                `gender`,
                `username`,
                `phone`,
                `address`,
                `city`,
                `zip`,
                ],
                where: { id: userId },
            })
            .then(function (userFound) {
              done(null, userFound)
            })
            .catch(function (err) {
                return res.status(500).json({ error: "unable to verify user" });
            });
        },
        function (userFound, done) {
            if (userFound) {
            userFound
                .update({
                email: email ? email : userFound.email,
                username: username ? username : userFound.username,
                firstname: firstname ? firstname : userFound.firstname,
                lastname: lastname ? lastname : userFound.lastname,
                dateOfBirth: dateOfBirth ? dateOfBirth : userFound.dateOfBirth,
                gender: gender ? gender : userFound.gender,
                phone: phone ? phone : userFound.phone,
                address: address ? address : userFound.address,
                city: city ? city : userFound.city,
                zip: zip ? zip : userFound.zip,
                })
                .then(function () {
                  const request = {
                    success: true,
                    userFound: userFound
                  }
                  done(res.json(request));
                })
                .catch(function (err) {
                console.log(err);
                res.status(500).json({ error: "cannot update user" });
                });
            }
        },
        ],
        function (userFound) {
            if (userFound) {
                return res.status(201).json(userFound);
            } else {
                return res.status(500).json({ error: "cannot update user profile" });
            }
        }
    );
});

// User Update Password
router.put("/updatePassword", (req, res) => {
    // Getting auth header
    var headerAuth = req.headers["authorization"];
    var userId = jwtUtils.getUserId(headerAuth);

    if (userId < 0) {
    return res.status(400).json({ error: "wrong token" });
    }

    // Params
    var password = req.body.password;
    var confirmPassword = req.body.confirmPassword;

    if (!PASSWORD_REGEX.test(password)) {
        return res
          .status(400)
          .json({
            error:
              "password invalid (must lenght 4 - 30 and include 1 number at least)",
          });
      }
      if (confirmPassword !== password) {
        return res.status(400).json({ error: "passwords must match" });
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
                done(null, userFound);
            })
            .catch(function (err) {
                return res.status(500).json({ error: "unable to verify user" });
            });
        },

        function (userFound, done) {
            if(userFound) {
              bcrypt.hash(password, 5, function (err, bcryptedPassword) {
                done(null, userFound, bcryptedPassword);
              });
            }
        },
        function (userFound, bcryptedPassword, done) {
            if (userFound) {
                userFound.update({
                password: bcryptedPassword ? bcryptedPassword : userFound.password,
                })
                .then(function () {
                  const request = {
                    success: true,
                    userId: userId,
                    updatedAt: userFound.updatedAt
                  }
                  done(res.json(request));
                })
                .catch(function (err) {
                res.status(500).json({ error: "cannot update user passsword" });
                });
            }
        },
        ],
        function (userFound) {
            if (userFound) {
                return res.status(201).json(userFound);
            } else {
                return res.status(500).json({ error: "cannot update user password" });
            }
        }
    );
});

// User Delete
router.delete("/profile", (req, res) => {
  // Getting auth header
  var headerAuth = req.headers["authorization"];
  var userId = jwtUtils.getUserId(headerAuth);

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
              done(null, userFound);
          })
          .catch(function (err) {
              return res.status(500).json({ error: "unable to verify user" });
          });
      },
      function (userFound, done) {
          if (userFound) {
              userFound.destroy({
                where:{
                  id: userId
                }
              })
              .then(function () {
                const request = {
                  success: true,
                  userId: userId,
                }
                done(res.json(request));
              })
              .catch(function (err) {
              res.status(500).json({ error: "cannot delete user" });
              });
          }
      },
      ],
      function (userFound) {
          if (userFound) {
              return res.status(201).json(userFound);
          } else {
              return res.status(500).json({ error: "cannot delete user" });
          }
      }
  );
});

module.exports = router;
