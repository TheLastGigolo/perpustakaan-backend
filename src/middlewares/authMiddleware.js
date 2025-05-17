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

module.exports = { authenticate };