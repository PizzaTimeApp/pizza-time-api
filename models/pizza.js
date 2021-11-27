'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class pizza extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // models.pizza.hasOne(models.reservation, {
      //   foreignKey: 'idPizza'
      // });
      models.pizza.hasMany(models.reservation);
      // models.pizza.belongsToMany(User, { through: 'reservation' });
      models.pizza.hasMany(models.pizzaIngredient);
    }
  };
  pizza.init({
    name: DataTypes.STRING,
    price: DataTypes.STRING,
    content: DataTypes.TEXT,
    image: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'pizza',
  });
  return pizza;
};