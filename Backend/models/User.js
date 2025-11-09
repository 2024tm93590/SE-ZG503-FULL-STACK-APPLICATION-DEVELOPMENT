const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db'); // import the Sequelize instance

const User = sequelize.define('User', {
  Id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'Id' },
  Name: { type: DataTypes.STRING, allowNull: false, field: 'Name' },
  Email: { type: DataTypes.STRING, unique: true, allowNull: false, field: 'Email' },
  Password: { type: DataTypes.STRING, allowNull: false, field: 'Password' },
  Role: { type: DataTypes.ENUM('student','staff','admin'), defaultValue: 'student', field: 'Role' }
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.Password = await bcrypt.hash(user.Password, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed('Password')) {
        user.Password = await bcrypt.hash(user.Password, 10);
      }
    }
  },
  tableName: 'Users',
  timestamps: false
});

module.exports = User;
