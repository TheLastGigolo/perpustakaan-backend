const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Create instance of ReportController
const reportController = new ReportController();

// Laporan peminjaman
router.get('/borrowings', authenticate, authorize('admin'), reportController.getBorrowingReports);
module.exports = router;