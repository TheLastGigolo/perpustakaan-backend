const successResponse = (res, statusCode = 200, message, data = null) => {
  const response = {
    status: 'success',
    message
  };
  
  if (data) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    status: 'error',
    message
  });
};

module.exports = { successResponse, errorResponse };