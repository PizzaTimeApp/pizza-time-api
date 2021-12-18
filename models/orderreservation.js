'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class orderReservation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.orderReservation.belongsTo(models.pizza, { 
        onDelete: 'Cascade',
        foreignKey: 'idPizza'
      });
      models.orderReservation.belongsTo(models.order, { 
        onDelete: 'Cascade',
        foreignKey: 'idOrder'
      });
    }
  };
  orderReservation.init({
    idOrder: DataTypes.INTEGER,  
    idPizza: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'orderReservation',
  });
  return orderReservation;
};
