const User = require('./User');
const Equipment = require('./Equipment');
const BorrowRequest = require('./BorrowRequest');
const { sequelize } = require('../config/db');

// Associations
User.hasMany(BorrowRequest, { foreignKey: 'UserId' });
BorrowRequest.belongsTo(User, { foreignKey: 'UserId', as: 'User' });

Equipment.hasMany(BorrowRequest, { foreignKey: 'EquipmentId' });
BorrowRequest.belongsTo(Equipment, { foreignKey: 'EquipmentId' });

// Approved by relationship
User.hasMany(BorrowRequest, { foreignKey: 'ApprovedBy', as: 'ApprovedRequests' });
BorrowRequest.belongsTo(User, { foreignKey: 'ApprovedBy', as: 'Approver' });

module.exports = { User, Equipment, BorrowRequest, sequelize };
