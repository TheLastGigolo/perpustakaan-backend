const Book = require('../models/bookModel');
const { successResponse, errorResponse } = require('../utils/response');
const { getRecommendedBooks } = require('../utils/ahpCalculator');

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
  
  static async getPopularBooks(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      // Get popular books from AHP calculator
      const popularBooks = await getRecommendedBooks(parseInt(limit));
      
      // Get full book details including cover_url for each popular book
      const booksWithDetails = await Promise.all(
        popularBooks.map(async (book) => {
          try {
            // Get complete book details to ensure we have cover_url
            const fullBookDetails = await Book.getBookById(book.id);
            
            if (!fullBookDetails) {
              console.warn(`Book with ID ${book.id} not found in database`);
              return null;
            }
            
            return {
              id: fullBookDetails.id,
              title: fullBookDetails.title,
              author: fullBookDetails.author,
              description: fullBookDetails.description,
              isbn: fullBookDetails.isbn,
              publisher: fullBookDetails.publisher,
              publication_year: fullBookDetails.publication_year,
              stock: fullBookDetails.stock,
              cover_url: fullBookDetails.cover_url, // Ensure cover_url is included
              is_active: fullBookDetails.is_active === 1,
              categories: fullBookDetails.categories ? fullBookDetails.categories.split(',') : [],
              popularity_score: parseFloat(book.ahp_score ? book.ahp_score.toFixed(2) : 0),
              borrow_count: book.borrow_count || 0
            };
          } catch (error) {
            console.error(`Error getting details for book ID ${book.id}:`, error);
            return null;
          }
        })
      );
      
      // Filter out any null results from failed book detail retrievals
      const validBooks = booksWithDetails.filter(book => book !== null);
      
      return successResponse(res, 200, {
        books: validBooks,
        total: validBooks.length,
        message: 'Popular books retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting popular books:', error);
      return errorResponse(res, 500, 'Failed to get popular books: ' + error.message);
    }
  }
  
  static async createBook(req, res) {
    try {
      // Validate required fields
      const requiredFields = ['title', 'author', 'isbn', 'publisher', 'publication_year', 'stock'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return errorResponse(res, 400, `${field} is required`);
        }
      }
  
      // Format categories if provided
      if (req.body.categories) {
        if (Array.isArray(req.body.categories)) {
          req.body.categories = req.body.categories.join(',');
        }
      }
  
      // Add cover URL if file was uploaded
      if (req.file) {
        req.body.cover_url = `/uploads/${req.file.filename}`;
      }
  
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
      
      // Add cover URL if file was uploaded
      if (req.file) {
        req.body.cover_url = `/uploads/${req.file.filename}`;
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
      
      // Check if book has any borrowing records
      const hasBorrowings = await Book.checkBookBorrowings(id);
      
      if (hasBorrowings) {
        // Option 1: Soft delete (deactivate the book)
        await Book.updateBook(id, { is_active: false });
        
        return successResponse(res, 200, { 
          message: 'Book deactivated successfully. Cannot delete book with existing borrowing records, but it has been deactivated instead.',
          action: 'deactivated'
        });
        
        // Option 2: Return error (uncomment this section and comment above if you prefer)
        /*
        return errorResponse(res, 400, 
          'Cannot delete book with existing borrowing records. Please ensure all borrowings are returned first.'
        );
        */
      }
      
      // If no borrowings exist, proceed with actual deletion
      await Book.deleteBook(id);
      
      return successResponse(res, 200, { 
        message: 'Book deleted successfully',
        action: 'deleted'
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      
      // Handle specific foreign key constraint error
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return errorResponse(res, 400, 
          'Cannot delete book with existing borrowing records. Please ensure all borrowings are returned first.'
        );
      }
      
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