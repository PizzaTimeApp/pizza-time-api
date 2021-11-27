'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reservations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      reservationDate: {
        allowNull: false,
        type: Sequelize.DATE
      },
      quantity: {
        allowNull: false,
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
      idUser: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
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
    await queryInterface.dropTable('reservations');
  }
};