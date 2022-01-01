//Import
const jwt = require("jsonwebtoken");
require("dotenv").config();

const response = require("./response");

//Exported functions
module.exports = {
  generateTokenForUser: function (userData) {
    return jwt.sign(
      {
        idUser: userData.id,
        isAdmin: userData.isAdmin,
      },
      process.env.JWT_SIGN_SECRET,
      {
        expiresIn: process.env.JWT_SIGN_EXPIRED,
      }
    );
  },
  generateTokenForResetPasswordUser: function (userData) {
    return jwt.sign(
      {
        idUser: userData.id,
      },
      process.env.JWT_RESET_PASSWORD_SECRET,
      {
        expiresIn: process.env.JWT_RESET_PASSWORD_EXPIRED,
      }
    );
  },
  parseAuthorization: function (authorization) {
    return authorization != null ? authorization.replace("Bearer ", "") : null;
  },
  getUserId: function (authorization) {
    var idUser = -1;
    var token = module.exports.parseAuthorization(authorization);
    if (token != null) {
      try {
        var jwtToken = jwt.verify(token, process.env.JWT_SIGN_SECRET);
        if (jwtToken != null) idUser = jwtToken.idUser;
      } catch (err) {}
    }
    return idUser;
  },
  getUserIdEmailVerify: function (token) {
    var idUser = -1;
    if (token != null) {
      try {
        var jwtToken = jwt.verify(token, process.env.JWT_RESET_PASSWORD_SECRET);
        if (jwtToken != null) idUser = jwtToken.idUser;
      } catch (err) {}
    }
    return idUser;
  },
  getIsAdmin: function (authorization) {
    var isAdmin = -1;
    var token = module.exports.parseAuthorization(authorization);
    if (token != null) {
      try {
        var jwtToken = jwt.verify(token, process.env.JWT_SIGN_SECRET);
        if (jwtToken != null) isAdmin = jwtToken.isAdmin;
      } catch (err) {}
    }
    return isAdmin;
  },
  verifyToken: (req, res, next) => {
    const headerAuth = req.headers["authorization"];
    const idUser = module.exports.getUserId(headerAuth);
    if (idUser < 0) {
      return res
        .status(401)
        .json(response.responseERROR(response.errorType.WRONG_TOKEN));
    } else {
      req.isAdmin = module.exports.getIsAdmin(headerAuth);
      req.idUser = idUser;
      next();
    }
  },
  verifyAdminToken: (req, res, next) => {
    const headerAuth = req.headers["authorization"];
    const isAdmin = module.exports.getIsAdmin(headerAuth);
    const idUser = module.exports.getUserId(headerAuth);
    if (idUser < 0) {
      return res
        .status(401)
        .json(response.responseERROR(response.errorType.WRONG_TOKEN));
    } else if (isAdmin != "admin") {
      return res.json(response.responseERROR(response.errorType.NO_ADMIN));
    } else {
      req.isAdmin = isAdmin;
      req.idUser = idUser;
      next();
    }
  },
};
