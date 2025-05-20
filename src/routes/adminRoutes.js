const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/authMiddleware');

// Hanya admin yang bisa akses
router.get('/dashboard', authenticate, adminController.getDashboardData);

module.exports = router;