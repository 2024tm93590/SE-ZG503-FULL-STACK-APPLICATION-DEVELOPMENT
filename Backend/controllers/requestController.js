const { BorrowRequest, Equipment, User } = require('../models');
const { Op, sequelize } = require('sequelize');
const { sequelize: dbInstance } = require('../config/db');

// Create Borrow Request with overlap prevention
exports.createRequest = async (req, res) => {
  try {
    // Handle both uppercase and lowercase field names from frontend
    const { 
      userId = req.body.UserId, 
      equipmentId = req.body.EquipmentId, 
      purpose = req.body.Purpose, 
      requestedDate = req.body.RequestedDate, 
      dueDate = req.body.DueDate 
    } = req.body;

    // Convert equipmentId to integer with better validation
    let equipmentIdInt;
    if (typeof equipmentId === 'string') {
      equipmentIdInt = parseInt(equipmentId.trim(), 10);
    } else if (typeof equipmentId === 'number') {
      equipmentIdInt = equipmentId;
    } else {
      return res.status(400).json({ message: 'Invalid equipment ID' });
    }

    if (isNaN(equipmentIdInt)) {
      return res.status(400).json({ message: 'Invalid equipment ID format' });
    }

    // Check equipment availability
    const equipment = await Equipment.findByPk(equipmentIdInt);
    
    if (!equipment) {
      return res.status(400).json({ message: 'Equipment not found' });
    }
    
    if (!equipment.Availability) {
      return res.status(400).json({ message: 'Equipment not available' });
    }

    // Check quantity-based availability
    const currentlyBorrowed = await BorrowRequest.count({
      where: {
        EquipmentId: equipmentIdInt,
        Status: { [Op.in]: ['PENDING', 'APPROVED'] },
        [Op.or]: [
          {
            RequestedDate: { [Op.lte]: dueDate },
            DueDate: { [Op.gte]: requestedDate }
          }
        ]
      }
    });

    if (currentlyBorrowed >= equipment.Quantity) {
      return res.status(400).json({ message: 'Equipment not available - all units are booked for the selected dates' });
    }

    const request = await BorrowRequest.create({ 
      UserId: parseInt(userId, 10), 
      EquipmentId: equipmentIdInt, 
      Purpose: purpose,
      RequestedDate: requestedDate,
      DueDate: dueDate
    });
    
    res.status(201).json({ message: 'Borrowing request created successfully', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Request Status (Approve/Reject/Return)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // Handle both uppercase and lowercase field names from frontend
    const status = req.body.status || req.body.Status;
    const notes = req.body.notes || req.body.Notes;
    const approvedBy = req.body.approvedBy || req.body.ApprovedBy;

    // Check if request exists first
    const existingRequest = await BorrowRequest.findByPk(parseInt(id, 10));

    if (!existingRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // For return endpoint, set status to RETURNED if not provided
    let finalStatus = status;
    if (req.path.includes('/return') && !status) {
      finalStatus = 'RETURNED';
    }

    const updateData = { Status: finalStatus };
    if (notes) updateData.Notes = notes;
    if (approvedBy) updateData.ApprovedBy = parseInt(approvedBy, 10);
    if (finalStatus === 'RETURNED') updateData.ReturnedDate = new Date();

    const [updated] = await BorrowRequest.update(updateData, { where: { Id: parseInt(id, 10) } });

    if (!updated) return res.status(404).json({ message: 'Request not found or not updated' });

    const updatedRequest = await BorrowRequest.findByPk(parseInt(id, 10), {
      include: [Equipment, { model: User, as: 'User' }]
    });
    
    res.status(200).json({ message: 'Request status updated successfully', updatedRequest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all requests with filters and analytics
exports.getRequests = async (req, res) => {
  try {
    const { status, userId, equipmentId, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.Status = status;
    if (userId) where.UserId = userId;
    if (equipmentId) where.EquipmentId = equipmentId;

    const requests = await BorrowRequest.findAndCountAll({
      where,
      include: [
        Equipment,
        { model: User, as: 'User', attributes: ['Id', 'Name', 'Email'] }
      ],
      order: [['Id', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      requests: requests.rows,
      totalCount: requests.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(requests.count / limit)
    });
  } catch (err) {
    console.error('Error in getRequests:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get overdue requests
exports.getOverdueRequests = async (req, res) => {
  try {
    const overdueRequests = await BorrowRequest.findAll({
      where: {
        Status: 'APPROVED',
        DueDate: { [Op.lt]: new Date() }
      },
      include: [Equipment, { model: User, as: 'User' }]
    });

    res.status(200).json(overdueRequests);
  } catch (err) {
    console.error('Error in getOverdueRequests:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get request analytics
exports.getRequestAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateCondition = '';
    
    if (startDate && endDate) {
      dateCondition = `WHERE CreatedAt BETWEEN '${startDate}' AND '${endDate}'`;
    }

    // Request status distribution
    const statusStatsQuery = `
      SELECT Status, COUNT(*) as count 
      FROM BorrowRequests 
      ${dateCondition}
      GROUP BY Status
    `;
    const [statusStats] = await dbInstance.query(statusStatsQuery);

    // Most borrowed equipment
    const equipmentStatsQuery = `
      SELECT 
        br.EquipmentId,
        COUNT(*) as borrowCount,
        e.Name as equipmentName,
        e.Category as equipmentCategory
      FROM BorrowRequests br
      LEFT JOIN Equipment e ON br.EquipmentId = e.Id
      ${dateCondition.replace('CreatedAt', 'br.CreatedAt')}
      GROUP BY br.EquipmentId, e.Name, e.Category
      ORDER BY COUNT(*) DESC
      OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
    `;
    const [equipmentStats] = await dbInstance.query(equipmentStatsQuery);

    // User activity
    const userStatsQuery = `
      SELECT 
        br.UserId,
        COUNT(*) as requestCount,
        u.Name as userName,
        u.Email as userEmail
      FROM BorrowRequests br
      LEFT JOIN Users u ON br.UserId = u.Id
      ${dateCondition.replace('CreatedAt', 'br.CreatedAt')}
      GROUP BY br.UserId, u.Name, u.Email
      ORDER BY COUNT(*) DESC
      OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
    `;
    const [userStats] = await dbInstance.query(userStatsQuery);

    res.status(200).json({
      statusDistribution: statusStats,
      popularEquipment: equipmentStats,
      activeUsers: userStats
    });
  } catch (err) {
    console.error('Error in getRequestAnalytics:', err);
    res.status(500).json({ message: err.message });
  }
};
