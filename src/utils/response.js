// src/utils/response.js
function successResponse(res, statusCode, data = null, message = 'Success') {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
}

function errorResponse(res, statusCode, message, errors = null) {
  return res.status(statusCode).json({
    status: 'error',
    message,
    errors
  });
}

module.exports = { successResponse, errorResponse };