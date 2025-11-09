const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Authenticate user via JWT
exports.authenticate = async (req, res, next) => {
  // Expect token in header: Authorization: Bearer <token>
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach decoded user info to req
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Authorize user by role
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient privileges' });
    }
    next();
  };
};
