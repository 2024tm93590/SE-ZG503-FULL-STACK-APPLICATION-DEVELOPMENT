const { Equipment, BorrowRequest, sequelize } = require('../models');
const { Op } = require('sequelize');

// Add Equipment
exports.addEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);
    res.status(201).json({ message: 'Equipment added successfully', equipment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Equipment with advanced search/filter
exports.getEquipment = async (req, res) => {
  try {
    const { category, availability, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let filter = {};
    if (category) filter.Category = category;
    if (availability !== undefined && availability !== '') filter.Availability = availability === 'true';
    
    // Search by name or category
    if (search) {
      filter[Op.or] = [
        { Name: { [Op.like]: `%${search}%` } },
        { Category: { [Op.like]: `%${search}%` } }
      ];
    }

    const equipment = await Equipment.findAndCountAll({ 
      where: filter,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['Name', 'ASC']]
    });

    res.status(200).json({
      equipment: equipment.rows,
      totalCount: equipment.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(equipment.count / limit)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Equipment Categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Equipment.findAll({
      attributes: [[Equipment.sequelize.fn('DISTINCT', Equipment.sequelize.col('Category')), 'Category']],
      raw: true
    });
    res.status(200).json(categories.map(c => c.Category));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Equipment
exports.updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    // Filter out any date fields that might cause conversion issues
    const updateData = { ...req.body };
    
    // Remove ALL timestamp-related fields
    delete updateData.CreatedAt;
    delete updateData.UpdatedAt;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // Convert availability to proper boolean if it exists
    if (updateData.Availability !== undefined) {
      updateData.Availability = updateData.Availability === true || updateData.Availability === 'true' || updateData.Availability === 1;
    }
    
    // Convert quantity to integer if it exists
    if (updateData.Quantity !== undefined) {
      updateData.Quantity = parseInt(updateData.Quantity);
    }
    
    // Remove any empty string fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === null || updateData[key] === 'undefined') {
        delete updateData[key];
      }
    });

    // Use raw SQL to avoid Sequelize timestamp issues
    const updateFields = [];
    const replacements = { id: parseInt(id) };
    let paramIndex = 1;
    
    Object.keys(updateData).forEach(key => {
      updateFields.push(`[${key}] = :param${paramIndex}`);
      replacements[`param${paramIndex}`] = updateData[key];
      paramIndex++;
    });
    
    // Add UpdatedAt manually with GETDATE()
    updateFields.push('[UpdatedAt] = GETDATE()');
    
    const sql = `UPDATE [Equipment] SET ${updateFields.join(', ')} WHERE [Id] = :id`;
    
    const [results, metadata] = await sequelize.query(sql, {
      replacements: replacements,
      type: sequelize.QueryTypes.UPDATE
    });
    
    if (results === 0) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const updatedEquipment = await Equipment.findByPk(id);
    
    res.status(200).json({ message: 'Equipment updated successfully', updatedEquipment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Equipment
exports.deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if equipment has any borrow requests (active or historical)
    const anyBorrows = await BorrowRequest.findOne({
      where: {
        EquipmentId: id
      }
    });

    if (anyBorrows) {
      // Check if there are active borrows
      const activeBorrows = await BorrowRequest.findOne({
        where: {
          EquipmentId: id,
          Status: { [Op.in]: ['PENDING', 'APPROVED'] }
        }
      });

      if (activeBorrows) {
        return res.status(400).json({ 
          message: '⚠️ Cannot Delete Equipment\n\nThis equipment currently has active borrow requests (pending approval or currently borrowed).\n\nPlease:\n• Wait for borrowed items to be returned\n• Reject any pending requests\n• Then try deleting again' 
        });
      } else {
        return res.status(400).json({ 
          message: '📚 Cannot Delete Equipment\n\nThis equipment has borrowing history and cannot be deleted to maintain school records.\n\nIf you want to remove it from active use:\n• Edit the equipment and set "Availability" to "Not Available"\n• This will hide it from students while preserving the borrowing history' 
        });
      }
    }

    const deleted = await Equipment.destroy({ where: { Id: id } });

    if (!deleted) return res.status(404).json({ message: 'Equipment not found' });

    res.status(200).json({ message: '✅ Equipment deleted successfully!' });
  } catch (err) {
    // Handle foreign key constraint errors specifically
    if (err.name === 'SequelizeForeignKeyConstraintError' || 
        err.message.includes('REFERENCE constraint') || 
        err.message.includes('foreign key constraint')) {
      return res.status(400).json({ 
        message: '🔒 Cannot Delete Equipment\n\nThis equipment is linked to borrowing records in the system.\n\nFor data integrity and audit purposes, equipment with borrowing history cannot be permanently deleted.\n\nAlternatives:\n• Mark as "Not Available" to hide from students\n• Contact IT administrator if equipment needs to be removed' 
      });
    }
    res.status(500).json({ message: 'An unexpected error occurred. Please try again or contact support.' });
  }
};
