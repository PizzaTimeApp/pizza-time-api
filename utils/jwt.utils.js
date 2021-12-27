//Import
const jwt = require("jsonwebtoken");
require("dotenv").config();

const response = require("./response");

const JWT_SIGN_SECRET = "rXKiWvi9JvcXdqwfdEDHjhgtFTT65gybhb";
const JWT_RESET_PASSWORD_SECRET = "BHBh75bFDLdfgfdg565ghfgc453f876N876n";

function getUserId(authorization) {
  var userId = -1;
  var token = module.exports.parseAuthorization(authorization);
  if (token != null) {
    try {
      var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
      if (jwtToken != null) userId = jwtToken.userId;
    } catch (err) {}
  }
  return userId;
}
function getIsAdmin(authorization) {
  var isAdmin = -1;
  var token = module.exports.parseAuthorization(authorization);
  if (token != null) {
    try {
      var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
      if (jwtToken != null) isAdmin = jwtToken.isAdmin;
    } catch (err) {}
  }
  return isAdmin;
}
//Exported functions
module.exports = {
  generateTokenForUser: function (userData) {
    return jwt.sign(
      {
        userId: userData.id,
        isAdmin: userData.isAdmin,
      },
      JWT_SIGN_SECRET,
      {
        expiresIn: process.env.JWT_SIGN_EXPIRED,
      }
    );
  },
  generateTokenForResetPasswordUser: function (userData) {
    return jwt.sign(
      {
        userId: userData.id,
      },
      JWT_RESET_PASSWORD_SECRET,
      {
        expiresIn: process.env.JWT_RESET_PASSWORD_EXPIRED,
      }
    );
  },
  parseAuthorization: function (authorization) {
    return authorization != null ? authorization.replace("Bearer ", "") : null;
  },
  getUserId: getUserId,
  getUserIdEmailVerify: function (token) {
    var userId = -1;
    if (token != null) {
      try {
        var jwtToken = jwt.verify(token, JWT_RESET_PASSWORD_SECRET);
        if (jwtToken != null) userId = jwtToken.userId;
      } catch (err) {}
    }
    return userId;
  },
  getIsAdmin: getIsAdmin,
  verifyToken: (req, res, next) => {
    const headerAuth = req.headers["authorization"];
    const idUser = getUserId(headerAuth);
    if (idUser < 0) {
      return res
        .status(401)
        .json(response.responseERROR(response.errorType.WRONG_TOKEN));
    } else {
      req.isAdmin = getIsAdmin(headerAuth);
      req.idUser = idUser;
      next();
    }
  },
  verifyAdminToken: (req, res, next) => {
    const headerAuth = req.headers["authorization"];
    const isAdmin = getIsAdmin(headerAuth);
    const idUser = getUserId(headerAuth);
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
