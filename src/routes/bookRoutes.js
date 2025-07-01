const express = require('express');
const router = express.Router();
const BookController = require('../controllers/bookController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure upload middleware
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'book-cover-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Apply authentication middleware to all book routes
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('admin'));

// Book routes
router.get('/', BookController.getAllBooks);
router.get('/search', BookController.searchBooks);
router.get('/filters', BookController.getFilterOptions);
router.post('/', upload.single('cover_file'), BookController.createBook);
router.get('/:id', BookController.getBookById);
router.put('/:id', upload.single('cover_file'), BookController.updateBook);
router.delete('/:id', BookController.deleteBook);

module.exports = router;