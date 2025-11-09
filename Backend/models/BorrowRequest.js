const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BorrowRequest = sequelize.define('BorrowRequest', {
  Id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'Id' },
  UserId: { type: DataTypes.INTEGER, allowNull: false },
  EquipmentId: { type: DataTypes.INTEGER, allowNull: false },
  Purpose: { type: DataTypes.STRING },
  Status: { type: DataTypes.ENUM('PENDING','APPROVED','REJECTED','RETURNED'), defaultValue: 'PENDING' },
  RequestedDate: { type: DataTypes.DATEONLY },
  DueDate: { type: DataTypes.DATEONLY },
  ReturnedDate: { type: DataTypes.DATEONLY },
  ApprovedBy: { type: DataTypes.INTEGER },
  Notes: { type: DataTypes.TEXT }
}, {
  tableName: 'BorrowRequests',
  timestamps: false
});

module.exports = BorrowRequest;
