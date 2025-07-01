const express = require('express');
const router = express.Router();
const BookController = require('../controllers/bookController');

// Public book routes
router.get('/search', BookController.searchBooks);
router.get('/filters', BookController.getFilterOptions);
router.get('/popular', BookController.getPopularBooks);
router.get('/', BookController.getAllBooks);
router.get('/:id', BookController.getBookById);

module.exports = router;