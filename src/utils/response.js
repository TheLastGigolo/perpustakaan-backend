const successResponse = (res, status, message, data = null) => {
  const response = {
    status: 'success',
    message
  };
  
  if (data) {
    response.data = data;
  }
  
  return res.status(status).json(response);
};

const errorResponse = (res, status, message) => {
  return res.status(status).json({
    status: 'error',
    message
  });
};

module.exports = { successResponse, errorResponse };