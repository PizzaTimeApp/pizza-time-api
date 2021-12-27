"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class pizza extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.pizza.hasMany(models.pizzaIngredient, {
        onDelete: "cascade",
        foreignKey: "id",
      });
    }
  }
  pizza.init(
    {
      name: DataTypes.STRING,
      price: DataTypes.STRING,
      creator: DataTypes.STRING,
      content: DataTypes.TEXT,
      image: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "pizza",
    }
  );
  return pizza;
};
