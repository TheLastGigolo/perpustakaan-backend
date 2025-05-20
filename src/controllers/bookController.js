const Book = require('../models/bookModel');
const { successResponse, errorResponse } = require('../utils/response');

class BookController {
  static async getAllBooks(req, res) {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      const filter = {};
      
      if (req.query.author) filter.author = req.query.author;
      if (req.query.publication_year) filter.publication_year = parseInt(req.query.publication_year) || req.query.publication_year;
      if (req.query.category) filter.category = req.query.category;
      if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === 'true';
      
      const { books, total } = await Book.getAllBooks({
        search,
        filter,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      const formattedBooks = books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        isbn: book.isbn,
        publisher: book.publisher,
        publication_year: book.publication_year,
        stock: book.stock,
        cover_url: book.cover_url,
        is_active: book.is_active === 1,
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
  
  static async searchBooks(req, res) {
    try {
      const { q: searchQuery, page = 1, limit = 10 } = req.query;
      
      if (!searchQuery || searchQuery.trim() === '') {
        return errorResponse(res, 400, 'Search query is required');
      }
      
      const { books, total } = await Book.searchBooks({
        searchQuery: searchQuery.trim(),
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      const formattedBooks = books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        isbn: book.isbn,
        publisher: book.publisher,
        publication_year: book.publication_year,
        stock: book.stock,
        cover_url: book.cover_url,
        is_active: book.is_active === 1,
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
      console.error('Error searching books:', error);
      return errorResponse(res, 500, 'Failed to search books: ' + error.message);
    }
  }
  
  static async getBookById(req, res) {
    try {
      const { id } = req.params;
      const book = await Book.getBookById(id);
      
      if (!book) {
        return errorResponse(res, 404, 'Book not found');
      }
      
      const formattedBook = {
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        isbn: book.isbn,
        publisher: book.publisher,
        publication_year: book.publication_year,
        stock: book.stock,
        cover_url: book.cover_url,
        is_active: book.is_active === 1,
        categories: book.categories ? book.categories.split(',') : []
      };
      
      return successResponse(res, 200, { book: formattedBook });
    } catch (error) {
      console.error('Error getting book:', error);
      return errorResponse(res, 500, 'Internal server error');
    }
  }
  
  static async createBook(req, res) {
    try {
      const bookId = await Book.createBook(req.body);
      const book = await Book.getBookById(bookId);
      
      if (!book) {
        return errorResponse(res, 500, 'Failed to create book');
      }
      
      const formattedBook = {
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        isbn: book.isbn,
        publisher: book.publisher,
        publication_year: book.publication_year,
        stock: book.stock,
        cover_url: book.cover_url,
        is_active: book.is_active === 1,
        categories: book.categories ? book.categories.split(',') : []
      };
      
      return successResponse(res, 201, { 
        message: 'Book created successfully',
        book: formattedBook 
      });
    } catch (error) {
      console.error('Error creating book:', error);
      return errorResponse(res, 500, 'Failed to create book: ' + error.message);
    }
  }
  
  static async updateBook(req, res) {
    try {
      const { id } = req.params;
      
      // First check if book exists
      const existingBook = await Book.getBookById(id);
      if (!existingBook) {
        return errorResponse(res, 404, 'Book not found');
      }
      
      await Book.updateBook(id, req.body);
      
      const updatedBook = await Book.getBookById(id);
      const formattedBook = {
        id: updatedBook.id,
        title: updatedBook.title,
        author: updatedBook.author,
        description: updatedBook.description,
        isbn: updatedBook.isbn,
        publisher: updatedBook.publisher,
        publication_year: updatedBook.publication_year,
        stock: updatedBook.stock,
        cover_url: updatedBook.cover_url,
        is_active: updatedBook.is_active === 1,
        categories: updatedBook.categories ? updatedBook.categories.split(',') : []
      };
      
      return successResponse(res, 200, { 
        message: 'Book updated successfully',
        book: formattedBook 
      });
    } catch (error) {
      console.error('Error updating book:', error);
      return errorResponse(res, 500, 'Failed to update book: ' + error.message);
    }
  }
  
  static async deleteBook(req, res) {
    try {
      const { id } = req.params;
      
      // First check if book exists
      const existingBook = await Book.getBookById(id);
      if (!existingBook) {
        return errorResponse(res, 404, 'Book not found');
      }
      
      await Book.deleteBook(id);
      
      return successResponse(res, 200, { 
        message: 'Book deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      return errorResponse(res, 500, 'Failed to delete book: ' + error.message);
    }
  }
  
  static async getFilterOptions(req, res) {
    try {
      const filterOptions = await Book.getFilterOptions();
      
      return successResponse(res, 200, { 
        filters: filterOptions 
      });
    } catch (error) {
      console.error('Error getting filter options:', error);
      return errorResponse(res, 500, 'Failed to get filter options: ' + error.message);
    }
  }
}

module.exports = BookController;