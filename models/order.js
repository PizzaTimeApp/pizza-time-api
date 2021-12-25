'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.order.belongsTo(models.user, { 
        onDelete: 'cascade',
        foreignKey: 'idUser'
      });
      models.order.hasMany(models.orderReservation, {
        onDelete: 'cascade',
        foreignKey: 'idOrder'
      });
    }
  };
  order.init({
    idUser: DataTypes.INTEGER,
    status: DataTypes.ENUM('new', 'pending payment', 'processing', 'complete', 'closed', 'canceled'),
  }, {
    sequelize,
    modelName: 'order',
  });
  return order;
};
