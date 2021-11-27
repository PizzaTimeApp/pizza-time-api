'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pizzaIngredients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      idPizza: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'pizzas',
          key: 'id'
        }
      },
      idIngredient: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'ingredients',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pizzaIngredients');
  }
};