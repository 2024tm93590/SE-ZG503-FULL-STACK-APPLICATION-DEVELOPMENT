const { Sequelize } = require('sequelize');

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,     // Database name
  process.env.DB_USER,     // DB username
  process.env.DB_PASSWORD, // DB password
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT, // should be 'mssql' for SQL Server
    logging: false,
    dialectOptions: {
      options: {
        encrypt: false, // Set true if using Azure SQL
      }
    }
  }
);

// Function to connect to the database
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
  } catch (err) {
    console.error('DB connection error:', err);
  }
};

module.exports = { sequelize, connectDB };
