const { Equipment, BorrowRequest } = require('../models');

exports.getStatistics = async (req, res) => {
  try {
    // Count total equipment items
    const totalItems = await Equipment.count();

    // Count borrowed equipment (status APPROVED)
    const borrowedItems = await BorrowRequest.count({
      where: { status: 'APPROVED' }
    });

    res.status(200).json({ totalItems, borrowedItems });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};
