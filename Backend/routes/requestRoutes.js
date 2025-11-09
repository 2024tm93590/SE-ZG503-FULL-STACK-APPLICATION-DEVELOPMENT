const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Get all requests (authenticated users)
router.get('/', authenticate, requestController.getRequests);

// Get overdue requests (admin/staff only)
router.get('/overdue', authenticate, authorizeRoles('admin', 'staff'), requestController.getOverdueRequests);

// Get analytics (admin only)
router.get('/analytics', authenticate, authorizeRoles('admin'), requestController.getRequestAnalytics);

// Logged-in users can create a borrowing request
router.post('/', authenticate, requestController.createRequest);

// Admin or staff can update the status of a borrowing request
router.put('/:id/status', authenticate, authorizeRoles('admin', 'staff'), requestController.updateRequestStatus);

// Return equipment (can be done by user or staff)
router.put('/:id/return', authenticate, requestController.updateRequestStatus);

module.exports = router;
