// src/models/bookModel.js
const db = require('../config/database');

class Book {
  static async getAllBooks({ search = '', filter = {}, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let query = 'SELECT b.*, GROUP_CONCAT(DISTINCT bc.name) as categories FROM books b ';
    query += 'LEFT JOIN book_category_mappings bcm ON b.id = bcm.book_id ';
    query += 'LEFT JOIN book_categories bc ON bcm.category_id = bc.id ';
    
    const whereClauses = [];
    const params = [];
    
    // Search
    if (search) {
      whereClauses.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
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
    let countQuery = 'SELECT COUNT(DISTINCT b.id) as total FROM books b ';
    countQuery += 'LEFT JOIN book_category_mappings bcm ON b.id = bcm.book_id ';
    countQuery += 'LEFT JOIN book_categories bc ON bcm.category_id = bc.id ';
    
    if (whereClauses.length > 0) {
      countQuery += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    const [totalResult] = await db.query(countQuery, params.slice(0, -2));
    const total = totalResult[0].total;
    
    return { books, total };
  }
  
  static async getBookById(id) {
    const [rows] = await db.query(
      `SELECT b.*, GROUP_CONCAT(DISTINCT bc.name) as categories 
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
    const { title, author, isbn, publisher, publication_year, stock, description, cover_url, categories } = bookData;
    
    const [result] = await db.query(
      'INSERT INTO books (title, author, isbn, publisher, publication_year, stock, description, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
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
    const { title, author, isbn, publisher, publication_year, stock, description, cover_url, categories, is_active } = bookData;
    
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
    const values = categoryIds.map(categoryId => [bookId, categoryId]);
    await db.query('INSERT INTO book_category_mappings (book_id, category_id) VALUES ?', [values]);
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
}

module.exports = Book;