//Import
const jwt = require('jsonwebtoken');

const JWT_SIGN_SECRET ='rXKiWvi9JvcXdqwfdEDHjhgtFTT65gybhb';
const JWT_RESET_PASSWORD_SECRET ='BHBh75bFDLdfgfdg565ghfgc453f876N876n';

//Exported functions
module.exports = {
    generateTokenForUser: function(userData) {
        return jwt.sign({
            userId: userData.id,
            isAdmin: userData.isAdmin
        },
        JWT_SIGN_SECRET,
        {
            expiresIn:'2h'
        })
    },
    generateTokenForResetPasswordUser: function(userData) {
        return jwt.sign({
            userId: userData.id,
        }, 
        JWT_RESET_PASSWORD_SECRET,
        {
            expiresIn:'10m'
        })
    },
    parseAuthorization:function(authorization) {
        return (authorization != null) ? authorization.replace('Bearer ', ''): null;
    },
    getUserId:function(authorization) {
        var userId = -1;
        var token = module.exports.parseAuthorization(authorization);
        if (token != null) {
            try {
                var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
                if(jwtToken != null)
                    userId = jwtToken.userId;
            } catch (err) { }
        }
        return userId;
    },
    getUserIdEmailVerify:function(token) {
        var userId = -1;
        if (token != null) {
            try {
                var jwtToken = jwt.verify(token, JWT_RESET_PASSWORD_SECRET);
                if(jwtToken != null)
                    userId = jwtToken.userId;
            } catch (err) { }
        }
        return userId;
    },
    getIsAdmin:function(authorization) {
        var isAdmin = -1;
        var token = module.exports.parseAuthorization(authorization);
        if (token != null) {
            try {
                var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
                if(jwtToken != null)
                isAdmin = jwtToken.isAdmin;
            } catch (err) { }
        }
        return isAdmin;
    }
}