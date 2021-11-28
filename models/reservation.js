'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class reservation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // models.reservation.hasOne(models.user, {
      //   foreignKey: 'idUser' 
      // });
      // models.reservation.hasOne(models.pizza, {
      //   foreignKey: 'idPizza' 
      // });
      // models.reservation.hasOne(models.pizza)
      // });

    }
  };
  reservation.init({
    reservationDate: DataTypes.DATE,
    quantity: DataTypes.INTEGER,
    idPizza: DataTypes.INTEGER,
    idUser: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'reservation',
  });
  return reservation;
};