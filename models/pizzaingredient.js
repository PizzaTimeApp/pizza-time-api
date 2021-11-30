'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class pizzaIngredient extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // models.pizzaIngredient.hasOne(models.pizza), {
      //   foreignKey: "idPizza"
      // };
      // models.pizzaIngredient.hasOne(models.ingredient, {
      //   foreignKey: 'idIngredient'
      // });
    }
  };
  pizzaIngredient.init({
    idPizza: DataTypes.INTEGER,
    idIngredient: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'pizzaIngredient',
  });
  return pizzaIngredient;
};