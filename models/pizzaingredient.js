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
      models.ingredient.belongsToMany(models.pizza, {
        through: models.pizzaIngredient,
        onDelete: "cascade",
        as: "pizza",
        foreignKey: "idIngredient",
      });
      models.pizza.belongsToMany(models.ingredient, {
        through: models.pizzaIngredient,
        onDelete: "cascade",
        as: "ingredient",
        foreignKey: "idPizza",
      });
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