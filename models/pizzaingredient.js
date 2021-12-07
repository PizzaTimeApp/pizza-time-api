"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class pizzaIngredient extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // models.ingredient.belongsToMany(models.pizza, {
      //   through: models.pizzaIngredient,
      //   onDelete: "cascade",
      //   foreignKey: "idPizza",
      // });
      // models.pizza.belongsToMany(models.ingredient, {
      //   through: models.pizzaIngredient,
      //   onDelete: "cascade",
      //   foreignKey: "idIngredient",
      // });
    }
  }
  pizzaIngredient.init(
    {
      idPizza: DataTypes.INTEGER,
      idIngredient: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "pizzaIngredient",
    }
  );
  return pizzaIngredient;
};
