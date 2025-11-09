const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticate } = require('../middleware/authMiddleware'); // JWT authentication middleware

// Only logged-in users can access statistics
router.get('/', authenticate, statisticsController.getStatistics);

module.exports = router;
