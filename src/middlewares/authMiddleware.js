const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');
const jwtConfig = require('../config/jwt');

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return errorResponse(res, 401, 'Akses ditolak. Tidak ada token yang diberikan.');
  }
  
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 400, 'Token tidak valid.');
  }
};

// Tambahkan fungsi authorize baru
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'User tidak terautentikasi');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res, 
        403, 
        `Akses ditolak. Role ${req.user.role} tidak diizinkan untuk akses ini.`
      );
    }

    next();
  };
};

// Export kedua fungsi
module.exports = { 
  authenticate,
  authorize
};