// src/routes/memberRoutes.js
const express = require('express');
const router = express.Router();
const MemberController = require('../controllers/memberController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication middleware to all member routes
router.use(authMiddleware.authenticate);

// Admin only routes
router.use(authMiddleware.authorize('admin', 'petugas'));

// Member routes
router.get('/', MemberController.getAllMembers);
router.get('/filters', MemberController.getFilterOptions);
router.post('/', upload.single('profile_picture'), MemberController.createMember);
router.get('/:id', MemberController.getMemberById);
router.put('/:id', upload.single('profile_picture'), MemberController.updateMember);
router.delete('/:id', MemberController.deleteMember);

module.exports = router;