const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// Public / logged-in users can view equipment and categories
router.get('/', authenticate, equipmentController.getEquipment);
router.get('/categories', authenticate, equipmentController.getCategories);

// Admin-only routes: Add, Update, Delete Equipment
router.post('/', authenticate, authorizeRoles('admin'), equipmentController.addEquipment);
router.put('/:id', authenticate, authorizeRoles('admin'), equipmentController.updateEquipment);
router.delete('/:id', authenticate, authorizeRoles('admin'), equipmentController.deleteEquipment);

module.exports = router;
