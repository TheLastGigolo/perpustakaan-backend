const express = require('express');
const router = express.Router();
const BorrowingController = require('../controllers/borrowingController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Admin routes
router.get('/', authenticate, authorize('admin'), BorrowingController.getAllBorrowings);
router.get('/:id', authenticate, authorize('admin'), BorrowingController.getBorrowingById);
router.put('/:id/status', authenticate, authorize('admin'), BorrowingController.updateBorrowingStatus);
router.post('/', authenticate, authorize('admin'), BorrowingController.createBorrowing);
router.delete('/:id', authenticate, authorize('admin'), BorrowingController.deleteBorrowing);

// Member routes
router.get('/member/:memberId', authenticate, authorize('anggota'), BorrowingController.getMemberBorrowings);

module.exports = router;