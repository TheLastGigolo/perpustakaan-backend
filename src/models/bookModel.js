// src/models/bookModel.js
const db = require('../config/database');

class Book {
  static async getAllBooks({ search = '', filter = {}, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        b.id, b.title, b.author, b.description, b.isbn, b.publisher, 
        b.publication_year, b.stock, b.cover_url, b.is_active,
        GROUP_CONCAT(DISTINCT bc.name) as categories 
      FROM books b 
      LEFT JOIN book_category_mappings bcm ON b.id = bcm.book_id 
      LEFT JOIN book_categories bc ON bcm.category_id = bc.id 
    `;
    
    const whereClauses = [];
    const params = [];
    
    // Search
    if (search) {
      whereClauses.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? OR b.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Filters
    if (filter.author) {
      whereClauses.push('b.author = ?');
      params.push(filter.author);
    }
    
    if (filter.publication_year) {
      whereClauses.push('b.publication_year = ?');
      params.push(filter.publication_year);
    }
    
    if (filter.category) {
      whereClauses.push('bc.name = ?');
      params.push(filter.category);
    }
    
    if (filter.is_active !== undefined) {
      whereClauses.push('b.is_active = ?');
      params.push(filter.is_active);
    }
    
    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    query += ' GROUP BY b.id ';
    query += ' ORDER BY b.created_at DESC ';
    query += ' LIMIT ? OFFSET ?';
    
    params.push(limit, offset);
    
    const [books] = await db.query(query, params);
    
    // Count total books for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT b.id) as total 
      FROM books b 
      LEFT JOIN book_category_mappings bcm ON b.id = bcm.book_id 
      LEFT JOIN book_categories bc ON bcm.category_id = bc.id 
    `;
    
    if (whereClauses.length > 0) {
      countQuery += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    const [totalResult] = await db.query(countQuery, params.slice(0, -2));
    const total = totalResult[0].total;
    
    return { books, total };
  }
  
  static async getBookById(id) {
    const [rows] = await db.query(
      `SELECT 
        b.id, b.title, b.author, b.description, b.isbn, b.publisher,
        b.publication_year, b.stock, b.cover_url, b.is_active,
        GROUP_CONCAT(DISTINCT bc.name) as categories 
       FROM books b 
       LEFT JOIN book_category_mappings bcm ON b.id = bcm.book_id 
       LEFT JOIN book_categories bc ON bcm.category_id = bc.id 
       WHERE b.id = ? 
       GROUP BY b.id`,
      [id]
    );
    return rows[0];
  }
  
  static async createBook(bookData) {
    const { 
      title, author, isbn, publisher, publication_year, 
      stock, description, cover_url, categories 
    } = bookData;
    
    const [result] = await db.query(
      `INSERT INTO books 
        (title, author, isbn, publisher, publication_year, stock, description, cover_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, isbn, publisher, publication_year, stock, description, cover_url]
    );
    
    const bookId = result.insertId;
    
    // Insert categories if provided
    if (categories && categories.length > 0) {
      await this.addBookCategories(bookId, categories);
    }
    
    return bookId;
  }
  
  static async updateBook(id, bookData) {
    const { 
      title, author, isbn, publisher, publication_year, 
      stock, description, cover_url, categories, is_active 
    } = bookData;
    
    await db.query(
      `UPDATE books SET 
        title = ?, 
        author = ?, 
        isbn = ?, 
        publisher = ?, 
        publication_year = ?, 
        stock = ?, 
        description = ?, 
        cover_url = ?, 
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, author, isbn, publisher, publication_year, stock, description, cover_url, is_active, id]
    );
    
    // Update categories if provided
    if (categories) {
      // First remove existing categories
      await db.query('DELETE FROM book_category_mappings WHERE book_id = ?', [id]);
      
      // Then add new categories
      if (categories.length > 0) {
        await this.addBookCategories(id, categories);
      }
    }
    
    return true;
  }
  
  static async deleteBook(id) {
    await db.query('DELETE FROM books WHERE id = ?', [id]);
    return true;
  }
  
  static async addBookCategories(bookId, categories) {
    // First get category IDs
    const [rows] = await db.query('SELECT id FROM book_categories WHERE name IN (?)', [categories]);
    const categoryIds = rows.map(row => row.id);
    
    // Then insert mappings
    if (categoryIds.length > 0) {
      const values = categoryIds.map(categoryId => [bookId, categoryId]);
      await db.query('INSERT INTO book_category_mappings (book_id, category_id) VALUES ?', [values]);
    }
  }
  
  static async getAuthors() {
    const [rows] = await db.query('SELECT DISTINCT author FROM books ORDER BY author');
    return rows.map(row => row.author);
  }
  
  static async getPublicationYears() {
    const [rows] = await db.query('SELECT DISTINCT publication_year FROM books ORDER BY publication_year DESC');
    return rows.map(row => row.publication_year);
  }
  
  static async getCategories() {
    const [rows] = await db.query('SELECT name FROM book_categories ORDER BY name');
    return rows.map(row => row.name);
  }
  
  static async searchBooks({ searchQuery, page = 1, limit = 10 }) {
    try {
      const offset = (page - 1) * limit;
      
      // Prepare search terms for fulltext search
      // Add * to each term for partial matching
      const searchTerms = searchQuery
        .split(' ')
        .filter(term => term.trim() !== '')
        .map(term => `+${term}*`)
        .join(' ');
      
      // First try FULLTEXT search
      let query = `
        SELECT 
          b.id, b.title, b.author, b.description, b.isbn, b.publisher,
          b.publication_year, b.stock, b.cover_url, b.is_active,
          GROUP_CONCAT(DISTINCT bc.name) as categories,
          MATCH(b.title, b.author, b.description) AGAINST(? IN BOOLEAN MODE) AS relevance
        FROM books b 
        LEFT JOIN book_category_mappings bcm ON b.id = bcm.book_id 
        LEFT JOIN book_categories bc ON bcm.category_id = bc.id 
        WHERE MATCH(b.title, b.author, b.description) AGAINST(? IN BOOLEAN MODE)
           OR b.isbn LIKE ?
        GROUP BY b.id 
        ORDER BY relevance DESC
        LIMIT ? OFFSET ?
      `;
      
      let countQuery = `
        SELECT COUNT(DISTINCT b.id) as total 
        FROM books b 
        WHERE MATCH(b.title, b.author, b.description) AGAINST(? IN BOOLEAN MODE)
           OR b.isbn LIKE ?
      `;
      
      const searchParams = [searchTerms, searchTerms, `%${searchQuery}%`, limit, offset];
      const countParams = [searchTerms, `%${searchQuery}%`];
      
      // Execute FULLTEXT search
      const [books] = await db.query(query, searchParams);
      const [totalResult] = await db.query(countQuery, countParams);
      
      // If no results with FULLTEXT, fall back to LIKE search for broader matches
      if (books.length === 0) {
        const likeQuery = `
          SELECT 
            b.id, b.title, b.author, b.description, b.isbn, b.publisher,
            b.publication_year, b.stock, b.cover_url, b.is_active,
            GROUP_CONCAT(DISTINCT bc.name) as categories
          FROM books b 
          LEFT JOIN book_category_mappings bcm ON b.id = bcm.book_id 
          LEFT JOIN book_categories bc ON bcm.category_id = bc.id 
          WHERE b.title LIKE ? 
             OR b.author LIKE ? 
             OR b.description LIKE ?
             OR b.isbn LIKE ?
             OR b.publisher LIKE ?
          GROUP BY b.id 
          LIMIT ? OFFSET ?
        `;
        
        const likeCountQuery = `
          SELECT COUNT(DISTINCT b.id) as total 
          FROM books b 
          WHERE b.title LIKE ? 
             OR b.author LIKE ? 
             OR b.description LIKE ?
             OR b.isbn LIKE ?
             OR b.publisher LIKE ?
        `;
        
        const likeParam = `%${searchQuery}%`;
        const likeParams = [likeParam, likeParam, likeParam, likeParam, likeParam, limit, offset];
        const likeCountParams = [likeParam, likeParam, likeParam, likeParam, likeParam];
        
        const [likeBooks] = await db.query(likeQuery, likeParams);
        const [likeTotalResult] = await db.query(likeCountQuery, likeCountParams);
        
        return {
          books: likeBooks,
          total: likeTotalResult[0].total
        };
      }
      
      return {
        books,
        total: totalResult[0].total
      };
    } catch (error) {
      console.error('Error in searchBooks:', error);
      throw error;
    }
  }
  
  static async getFilterOptions() {
    try {
      const authors = await this.getAuthors();
      const publicationYears = await this.getPublicationYears();
      const categories = await this.getCategories();
      
      return {
        authors,
        publication_years: publicationYears,
        categories
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      throw error;
    }
  }
}

module.exports = Book;