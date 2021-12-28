// Imports
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwtUtils = require("../utils/jwt.utils");
const emailSender = require("../utils/email.utils");
const models = require("../models");
const asyncLib = require("async");
const response = require("../utils/response");

//constants
const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX = /^(?=.*\d).{4,30}$/;
const ZIP_REGEX = /^\d{5}$/;
const GENDER_REGEX = /^(male|female)$/;
const DATEOFBIRTH_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_REGEX = /^\d*$/;

// User Register
router.post("/register", (req, res) => {
  // Params
  const email = req.body.email.trim();
  const firstname = req.body.firstname.trim();
  const lastname = req.body.lastname.trim();
  const username = req.body.username.trim();
  const password = req.body.password.trim();
  const confirmPassword = req.body.confirmPassword.trim();
  const gender = req.body.gender.trim();
  const dateOfBirth = req.body.dateOfBirth.trim();
  const phone = req.body.phone.trim();
  const address = req.body.address.trim();
  const city = req.body.city.trim();
  const zip = req.body.zip.trim();

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
      return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
    }
  });

  // Conditions & Validations
  if (username.length < 3 || username.length >= 17) {
    return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_USERNAME));
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_EMAIL));
  }
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_PASSWORD));
  }
  if (confirmPassword !== password) {
    return res.status(400).json(response.responseERROR(response.errorType.USER.DIFFERENT_PASSWORD));
  }
  if (!GENDER_REGEX.test(gender)) {
    return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_GENDER));
  }
  if (!ZIP_REGEX.test(zip)) {
    return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_ZIP));
  }
  if (!DATEOFBIRTH_REGEX.test(dateOfBirth)) {
    return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_DATEOFBIRTH));
  }
  if (!PHONE_REGEX.test(phone)) {
    return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_PHONE));
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
            console.log(err);
            return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
          });
      },
      function (userFound, done) {
        if (!userFound) {
          bcrypt.hash(password, 5, function (err, bcryptedPassword) {
            done(null, userFound, bcryptedPassword);
          });
        } else {
          return res.status(409).json(response.responseERROR(response.errorType.USER.EXIST));
        }
      },
      function (userFound, bcryptedPassword, done) {
        const newUser = models.user
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
            console.log(err);
            return res.status(400).json(response.responseERROR(response.errorType.USER.CANT_CREATE));
          });
      },
    ],
    function (newUser) {
      if (newUser) {
        return res.status(201).json(response.responseOK("", {userId: newUser.id}));
      } else {
        return res.status(400).json(response.responseERROR(response.errorType.USER.CANT_CREATE));
      }
    }
  );
});

// User Login
router.post("/login", (req, res) => {
  // Params
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  if (email == null || password == null || email == "" || password == "") {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
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
              return res.status(200).json(response.responseOK("", {userId : userFound.id, token : jwtUtils.generateTokenForUser(userFound)}));
            } else {
              return res.status(200).json(response.responseERROR(response.errorType.USER.INVALID_PASSWORD));
            }
          }
        );
      } else {
        return res.status(200).json(response.responseERROR(response.errorType.USER.NOEXIST));
      }
    })
    .catch(function (err) {
      return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
    });
});

// User Profile
router.get("/profile", jwtUtils.verifyToken, (req, res) => {
  const userId = req.idUser.trim();

  if (!userId) {
    return res.json(response.responseERROR(response.errorType.INVALID_FIELDS));
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
        return res.status(201).json(response.responseOK("", {user: user}));
      } else {
        return res.json(response.responseERROR(response.errorType.USER.NOT_FOUND));
      }
    })
    .catch(function (err) {
        return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
    });
});

// User Update Profile
router.put("/profile", jwtUtils.verifyToken, (req, res) => {
  const userId = req.idUser;


  // Params
  const email = req.body.email.trim();
  const username = req.body.username.trim();
  const firstname = req.body.firstname.trim();
  const lastname = req.body.lastname.trim();
  const dateOfBirth = req.body.dateOfBirth.trim();
  const gender = req.body.gender.trim();
  const phone = req.body.phone.trim();
  const address = req.body.address.trim();
  const city = req.body.city.trim();
  const zip = req.body.zip.trim();

  if (username) {
    if (username.length < 3 || username.length >= 17) {
      return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_USERNAME));
    }
  }

  if (email) {
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_EMAIL));
    }
  }

  if (gender) {
    if (!GENDER_REGEX.test(gender)) {
      return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_GENDER));
    }
  }

  if (zip) {
    if (!ZIP_REGEX.test(zip)) {
      return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_ZIP));
    }
  }

  if (dateOfBirth) {
    if (!DATEOFBIRTH_REGEX.test(dateOfBirth)) {
      return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_DATEOFBIRTH));
    }
  }

  if (phone) {
    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_PHONE));
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
            done(null, userFound);
          })
          .catch(function (err) {
            return res.status(400).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
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
            .then(function (userFound) {
              done(userFound);
            })
            .catch(function (err) {
              console.log(err);
              return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_UPDATE));
            });
        } else {
          return res.status(400).json(response.responseERROR(response.errorType.USER.NOT_FOUND));
        }
      },
    ],
    function (userFound) {
      if (userFound) {
        return res.status(201).json(response.responseOK("", {user: userFound}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_UPDATE));
      }
    }
  );
});

// User Update Password
router.put("/updatePassword", jwtUtils.verifyToken, (req, res) => {
  const userId = req.idUser

  // Params
  const password = req.body.password.trim();
  const confirmPassword = req.body.confirmPassword.trim();

  if (!PASSWORD_REGEX.test(password)) {
    return res.json(response.responseERROR(response.errorType.USER.WRONG_PASSWORD));
  }

  if (confirmPassword !== password) {
    return res.json(response.responseERROR(response.errorType.USER.DIFFERENT_PASSWORD));
  }

  asyncLib.waterfall(
    [
      function (done) {
        models.user
          .findOne({
            attributes: [`id`],
            where: { id: userId },
          })
          .then(function (userFound) {
            done(null, userFound);
          })
          .catch(function (err) {
          return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
          });
      },

      function (userFound, done) {
        if (userFound) {
          bcrypt.hash(password, 5, function (err, bcryptedPassword) {
            done(null, userFound, bcryptedPassword);
          });
        } else {
          return res.status(200).json(response.responseERROR(response.errorType.USER.NOT_FOUND));
        }
      },
      function (userFound, bcryptedPassword, done) {
        if (userFound) {
          userFound
            .update({
              password: bcryptedPassword
                ? bcryptedPassword
                : userFound.password,
            })
            .then(function (userFound) {
              done(userFound);
            })
            .catch(function (err) {
            return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_UPDATE_PASSWORD));
            });
        } else {
          return res.status(400).json(response.responseERROR(response.errorType.USER.NOT_FOUND));
        }
      },
    ],
    function (userFound) {
      if (userFound) {
        return res.status(201).json(response.responseOK("", {userId: userId, updatedAt: userFound.updatedAt}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_UPDATE_PASSWORD));
      }
    }
  );
});

// User Delete
router.delete("/profile", jwtUtils.verifyToken, (req, res) => {
  const userId = req.idUser

  asyncLib.waterfall(
    [
      function (done) {
        models.user
          .findOne({
            where: { id: userId },
          })
          .then(function (userFound) {
            done(null, userFound);
          })
          .catch(function (err) {
            return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
          });
      },
      function (userFound, done) {
        if (userFound) {
          userFound
            .destroy({
              where: {
                id: userId,
              },
            })
            .then(function (userFound) {
              done(userFound);
            })
            .catch(function (err) {
            return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_DELETE));
            });
        } else {
          return res.status(500).json(response.responseERROR(response.errorType.USER.NOEXIST));
        }
      },
    ],
    function (userFound) {
      if (userFound) {
        return res.status(200).json(response.responseOK("",{ userId: userId}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_DELETE));
      }
    }
  );
});

// Reset user Password
router.post("/requestEmailPassword", (req, res) => {
  const email = req.body.email.trim();

  if (!email) {
    return res.status(500).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }

  asyncLib.waterfall(
    [
      function (done) {
        models.user
          .findOne({
            attributes: [`id`, `email`],
            where: { email: email },
          })
          .then(function (userFound) {
            if (userFound) {
              done(null, userFound);
            } else {
            return res.status(400).json(response.responseERROR(response.errorType.USER.EMAIL_NOEXIST));
            }
          })
          .catch(function (err) {
            return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
          });
      },
      function (newResetPasswordRequest, done) {
        const createResetPasswordRequest = models.resetPasswordRequest
          .create({
            hashedToken: jwtUtils.generateTokenForResetPasswordUser(
              newResetPasswordRequest
            ),
            requestedAt: new Date(),
            idUser: newResetPasswordRequest.id,
          })
          .then(function (sendResetPasswordEmail) {
            done(null, sendResetPasswordEmail);
          })
          .catch(function (err) {
            console.log(err);
            return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_ADD_PASSWORD_REQUEST));
          });
      },
      function (sendResetPasswordEmail, done) {
        emailSender
          .emailData(email, sendResetPasswordEmail.hashedToken)
          .then(function (resetPasswordRequest) {
            done(sendResetPasswordEmail);
          })
          .catch(function (err) {
            console.log(err);
            return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_SEND_PASSWORD_REQUEST));
          });
      },
    ],
    function (resetPasswordRequest) {
      if (resetPasswordRequest) {
        return res.status(200).json(response.responseOK("", {userId: resetPasswordRequest.idUser}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY_EMAIL));
      }
    }
  );
});

// Reset user Password
router.put("/resetPassword/:token", (req, res) => {
  // Params
  const token = req.params.token;
  const userId = jwtUtils.getUserIdEmailVerify(token);
  const password = req.body.password.trim();
  const confirmPassword = req.body.confirmPassword.trim();

  if (userId < 0) {
    return res.status(400).json(response.responseERROR(response.errorType.WRONG_TOKEN));
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json(response.responseERROR(response.errorType.USER.WRONG_PASSWORD));
  }
  if (confirmPassword !== password) {
    return res.status(400).json(response.responseERROR(response.errorType.USER.DIFFERENT_PASSWORD));
  }

  asyncLib.waterfall(
    [
      function (done) {
        models.user
          .findOne({
            attributes: [`id`],
            where: { id: userId },
          })
          .then(function (userFound) {
            done(null, userFound);
          })
          .catch(function (err) {
          return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
          });
      },

      function (userFound, done) {
        if (userFound) {
          bcrypt.hash(password, 5, function (err, bcryptedPassword) {
            done(null, userFound, bcryptedPassword);
          });
        } else {
          return res.status(500).json(response.responseERROR(response.errorType.USER.NOT_FOUND));
        }
      },
      function (userFound, bcryptedPassword, done) {
        if (userFound) {
          userFound
            .update({
              password: bcryptedPassword
                ? bcryptedPassword
                : userFound.password,
            })
            .then(function (userFound) {
              done(userFound);
            })
            .catch(function (err) {
            return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_RESET_PASSWORD));
            });
        }
      },
    ],
    function (userFound) {
      if (userFound) {
        return res.status(200).json(response.responseOK("",{userId: userId, updatedAt: userFound.updatedAt}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_RESET_PASSWORD));
      }
    }
  );
});

// User Delete Admin
router.delete("/deleteUser/:id", jwtUtils.verifyAdminToken, (req, res) => {

  const idDeletedUser = req.params.id;
  if (idDeletedUser <= 0) {
    return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));
  }
  asyncLib.waterfall(
    [
      function (done) {
        models.user
          .findOne({
            attributes: [`id`],
            where: { id: idDeletedUser },
          })
          .then(function (userFound) {
            done(null, userFound);
          })
          .catch(function (err) {
            return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
          });
      },
      function (userFound, done) {
        if (userFound) {
          userFound
            .destroy({
              where: {
                id: idDeletedUser,
              },
            })
            .then(function (userFound) {
              done(userFound);
            })
            .catch(function (err) {
              console.log(err);
              return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_DELETE));
            });
        } else {
          return res.status(400).json(response.responseERROR(response.errorType.USER.NOEXIST));
        }
      },
    ],
    function (userFound) {
      if (userFound) {
        return res.status(201).json(response.responseOK("",{userId: idDeletedUser}));
      } else {
        return res.status(500).json(response.responseERROR(response.errorType.USER.CANT_DELETE));
      }
    }
  );
});

//Get Users
router.get("/getUsers", jwtUtils.verifyAdminToken, (req, res) => {

  const limit = parseInt(req.query.limit);
  const offset = parseInt(req.query.offset);
  const order = req.query.order;

  models.user
    .findAll({
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
      ],
      order: [order != null ? order.split(":") : ["id", "ASC"]],
      limit: !isNaN(limit) ? limit : null,
      offset: !isNaN(offset) ? offset : null,
    })
    .then(function (users) {
      if (users) {
        return res.status(200).json(response.responseOK("",{users: users}));
      } else {
        return res.status(400).json(response.responseERROR(response.errorType.USER.NOT_FOUND));
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.status(500).json(response.responseERROR(response.errorType.INVALID_FIELDS));
    });
});

//get User by id
router.get("/getUser/:id", jwtUtils.verifyAdminToken, (req, res) => {
  const idUser = req.params.id.trim();

  if (idUser == undefined || idUser == null || idUser == "")
  return res.status(400).json(response.responseERROR(response.errorType.INVALID_FIELDS));

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
      ],
      where: { id: idUser },
    })
    .then(function (userFound) {
      if (userFound) {
        return res.status(200).json(response.responseOK("",{user: userFound}));
      } else {
        return res.status(400).json(response.responseERROR(response.errorType.USER.NOT_FOUND));
      }
    })
    .catch(function (err) {
      console.log(err);
      return res.status(500).json(response.responseERROR(response.errorType.USER.UNABLE_TO_VERIFY));
    });
});

module.exports = router;
