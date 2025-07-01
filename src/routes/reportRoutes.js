// src/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Middleware untuk memastikan hanya admin yang bisa akses laporan
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard Statistics
router.get('/dashboard', ReportController.getDashboardStats);

// Borrowing Reports
router.get('/borrowings', ReportController.getBorrowingReport);

// Popular Books Report
router.get('/popular-books', ReportController.getPopularBooksReport);

// Active Members Report
router.get('/active-members', ReportController.getActiveMembersReport);

// Overdue Report
router.get('/overdue', ReportController.getOverdueReport);

// Stock Report
router.get('/stock', ReportController.getStockReport);

// Monthly Report
router.get('/monthly', ReportController.getMonthlyReport);

module.exports = router;