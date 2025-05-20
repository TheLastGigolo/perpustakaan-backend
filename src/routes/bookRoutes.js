// src/routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const BookController = require('../controllers/bookController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply authentication middleware to all book routes
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('admin'));

// Book routes
router.get('/', BookController.getAllBooks);
router.get('/search', BookController.searchBooks);
router.get('/filters', BookController.getFilterOptions);
router.post('/', BookController.createBook);
router.get('/:id', BookController.getBookById);
router.put('/:id', BookController.updateBook);
router.delete('/:id', BookController.deleteBook);

module.exports = router;