'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class resetPasswordRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // models.resetPasswordRequest.hasOne(models.user, {
      //   foreignKey: 'idUser'
      // });
    }
  };
  resetPasswordRequest.init({
    hashedToken: DataTypes.STRING,
    requestedAt: DataTypes.DATE,
    idUser: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'resetPasswordRequest',
  });
  return resetPasswordRequest;
};