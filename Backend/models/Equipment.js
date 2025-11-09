const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Equipment = sequelize.define('Equipment', {
  Id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'Id' },
  Name: { type: DataTypes.STRING, allowNull: false, field: 'Name' },
  Category: { type: DataTypes.STRING, allowNull: false, field: 'Category' },
  Condition: { type: DataTypes.STRING, defaultValue: 'Good', field: 'Condition' },
  Quantity: { type: DataTypes.INTEGER, defaultValue: 1, field: 'Quantity' },
  Availability: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'Availability' }
}, {
  tableName: 'Equipment',
  timestamps: false
});

module.exports = Equipment;
