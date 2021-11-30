'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // models.user.hasMany(models.resetPasswordRequest);
      // models.user.hasMany(models.reservation);
      // models.user.hasMany(models.resetPasswordRequest);
      models.user.hasMany(models.reservation, {
        onDelete: 'cascade',
        foreignKey: 'id'
      });
      // models.user.belongsToMany(Pizza, { through: 'reservation' });
    }
  };
  user.init({
    email: DataTypes.STRING,
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    isAdmin: DataTypes.ENUM('user', 'admin'),
    gender: DataTypes.ENUM('male', 'female'),
    dateOfBirth: DataTypes.DATE,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    zip: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'user',
  });
  return user;
};