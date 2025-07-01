const db = require('../config/database');

class Borrowing {
  static async getAllBorrowings({ search = '', status = '', page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        b.id, 
        b.borrow_date, 
        b.due_date, 
        b.return_date, 
        b.status, 
        b.admin_notes,
        b.created_at,
        bk.title AS book_title,
        bk.author AS book_author,
        bk.isbn AS book_isbn,
        u.name AS member_name,
        u.email AS member_email,
        m.member_code,
        m.nim,
        m.faculty,
        m.study_program,
        m.phone
      FROM borrowings b
      JOIN books bk ON b.book_id = bk.id
      JOIN members m ON b.member_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (
        bk.title LIKE ? OR 
        bk.author LIKE ? OR 
        u.name LIKE ? OR 
        m.member_code LIKE ? OR 
        m.nim LIKE ?
      )`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }
    
    if (status) {
      query += ` AND b.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY b.borrow_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [borrowings] = await db.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM borrowings b
      JOIN books bk ON b.book_id = bk.id
      JOIN members m ON b.member_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE 1=1
    `;
    
    const countParams = [...params.slice(0, -2)]; // Remove limit and offset
    
    if (search) {
      countQuery += ` AND (
        bk.title LIKE ? OR 
        bk.author LIKE ? OR 
        u.name LIKE ? OR 
        m.member_code LIKE ? OR 
        m.nim LIKE ?
      )`;
    }
    
    if (status) {
      countQuery += ` AND b.status = ?`;
    }
    
    const [total] = await db.query(countQuery, countParams);
    
    return {
      borrowings,
      total: total[0].total,
      page,
      limit,
      totalPages: Math.ceil(total[0].total / limit)
    };
  }

  static async getBorrowingById(id) {
    const [rows] = await db.query(`
      SELECT 
        b.*, 
        bk.title AS book_title,
        bk.author AS book_author,
        bk.isbn AS book_isbn,
        u.name AS member_name,
        u.email AS member_email,
        m.member_code,
        m.nim,
        m.faculty,
        m.study_program,
        m.phone
      FROM borrowings b
      JOIN books bk ON b.book_id = bk.id
      JOIN members m ON b.member_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE b.id = ?
    `, [id]);
    
    return rows[0];
  }

  static async updateBorrowingStatus(id, status, adminNotes = null) {
    const updateData = {
      status,
      updated_at: new Date()
    };
    
    if (status === 'dipinjam') {
      updateData.confirmed_at = new Date();
    }
    
    if (status === 'dikembalikan') {
      updateData.return_date = new Date();
    }
    
    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }
    
    await db.query('UPDATE borrowings SET ? WHERE id = ?', [updateData, id]);
    
    // Update book stock if returned
    if (status === 'dikembalikan') {
      const borrowing = await this.getBorrowingById(id);
      await db.query('UPDATE books SET stock = stock + 1 WHERE id = ?', [borrowing.book_id]);
    }
    
    return this.getBorrowingById(id);
  }

  static async createBorrowing(bookId, memberId, borrowDate, dueDate, status = 'antri') {
    const [result] = await db.query(`
      INSERT INTO borrowings 
      (book_id, member_id, borrow_date, due_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [bookId, memberId, borrowDate, dueDate, status]);
    
    return this.getBorrowingById(result.insertId);
  }

  static async getBorrowingsByMember(memberId, { status = '', page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        b.id, 
        b.borrow_date, 
        b.due_date, 
        b.return_date, 
        b.status, 
        b.admin_notes,
        b.created_at,
        bk.title AS book_title,
        bk.author AS book_author,
        bk.isbn AS book_isbn
      FROM borrowings b
      JOIN books bk ON b.book_id = bk.id
      WHERE b.member_id = ?
    `;
    
    const params = [memberId];
    
    if (status) {
      query += ` AND b.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY b.borrow_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const [borrowings] = await db.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM borrowings 
      WHERE member_id = ?
    `;
    
    const countParams = [memberId];
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    
    const [total] = await db.query(countQuery, countParams);
    
    return {
      borrowings,
      total: total[0].total,
      page,
      limit,
      totalPages: Math.ceil(total[0].total / limit)
    };
  }

  static async deleteBorrowing(id) {
    const [result] = await db.query('DELETE FROM borrowings WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Borrowing;