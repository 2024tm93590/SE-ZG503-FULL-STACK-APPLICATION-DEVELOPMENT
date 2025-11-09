const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/statistics', require('./routes/statisticsRoutes'));

// Test route
app.get('/', (req, res) => res.send('Equipment Lending API is running ✅'));

module.exports = app;
