// src/controllers/bookController.js
const Book = require('../models/bookModel');
const { successResponse, errorResponse } = require('../utils/response');

class BookController {
  static async getAllBooks(req, res) {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      
      // Build filter object
      const filter = {};
      if (req.query.author) filter.author = req.query.author;
      if (req.query.publication_year) filter.publication_year = req.query.publication_year;
      if (req.query.category) filter.category = req.query.category;
      if (req.query.is_active) filter.is_active = req.query.is_active === 'true';
      
      const { books, total } = await Book.getAllBooks({
        search,
        filter,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      // Format books data
      const formattedBooks = books.map(book => ({
        ...book,
        categories: book.categories ? book.categories.split(',') : []
      }));
      
      const totalPages = Math.ceil(total / limit);
      
      return successResponse(res, 200, {
        books: formattedBooks,
        pagination: {
          total,
          total_pages: totalPages,
          current_page: parseInt(page),
          per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error getting books:', error);
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async getBookById(req, res) {
    try {
      const book = await Book.getBookById(req.params.id);
      
      if (!book) {
        return errorResponse(res, 404, 'Book not found');
      }
      
      // Format categories
      book.categories = book.categories ? book.categories.split(',') : [];
      
      return successResponse(res, 200, book);
    } catch (error) {
      console.error('Error getting book:', error);
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async createBook(req, res) {
    try {
      const { categories = [], ...bookData } = req.body;
      
      // Validate required fields
      if (!bookData.title || !bookData.author || !bookData.stock) {
        return errorResponse(res, 400, 'Title, author, and stock are required');
      }
      
      const bookId = await Book.createBook({
        ...bookData,
        categories
      });
      
      return successResponse(res, 201, { id: bookId }, 'Book created successfully');
    } catch (error) {
      console.error('Error creating book:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 400, 'ISBN already exists');
      }
      
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async updateBook(req, res) {
    try {
      const { id } = req.params;
      const { categories, ...bookData } = req.body;
      
      // Check if book exists
      const existingBook = await Book.getBookById(id);
      if (!existingBook) {
        return errorResponse(res, 404, 'Book not found');
      }
      
      await Book.updateBook(id, {
        ...bookData,
        categories
      });
      
      return successResponse(res, 200, null, 'Book updated successfully');
    } catch (error) {
      console.error('Error updating book:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 400, 'ISBN already exists');
      }
      
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async deleteBook(req, res) {
    try {
      const { id } = req.params;
      
      // Check if book exists
      const existingBook = await Book.getBookById(id);
      if (!existingBook) {
        return errorResponse(res, 404, 'Book not found');
      }
      
      await Book.deleteBook(id);
      
      return successResponse(res, 200, null, 'Book deleted successfully');
    } catch (error) {
      console.error('Error deleting book:', error);
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async getFilterOptions(req, res) {
    try {
      const [authors, years, categories] = await Promise.all([
        Book.getAuthors(),
        Book.getPublicationYears(),
        Book.getCategories()
      ]);
      
      return successResponse(res, 200, {
        authors,
        years,
        categories
      });
    } catch (error) {
      console.error('Error getting filter options:', error);
      return errorResponse(res, 500, 'Internal server error');
    }
  }
}

module.exports = BookController;