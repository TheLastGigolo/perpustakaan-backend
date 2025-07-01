// src/models/reportModel.js
const db = require('../config/database');

class ReportModel {
  // Helper method untuk date range queries
  static buildDateRangeQuery(baseQuery, params, startDate, endDate, dateColumn = 'created_at') {
    let query = baseQuery;
    let queryParams = [...params];

    if (startDate) {
      query += ` AND ${dateColumn} >= ?`;
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ` AND ${dateColumn} <= ?`;
      queryParams.push(endDate);
    }

    return { query, params: queryParams };
  }

  // Laporan berdasarkan fakultas
  static async getBorrowingsByFaculty(filters = {}) {
    try {
      const { startDate, endDate } = filters;
      
      let query = `
        SELECT 
          m.faculty,
          COUNT(b.id) as total_borrowings,
          COUNT(CASE WHEN b.status = 'dipinjam' THEN 1 END) as active_borrowings,
          COUNT(CASE WHEN b.status = 'dikembalikan' THEN 1 END) as returned_books,
          COUNT(CASE WHEN b.status = 'dipinjam' AND b.due_date < CURDATE() THEN 1 END) as overdue_books
        FROM borrowings b
        JOIN members m ON b.member_id = m.id
        WHERE 1=1
      `;

      const queryBuilder = this.buildDateRangeQuery(query, [], startDate, endDate, 'b.borrow_date');
      
      queryBuilder.query += `
        GROUP BY m.faculty
        ORDER BY total_borrowings DESC
      `;

      const [rows] = await db.execute(queryBuilder.query, queryBuilder.params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Laporan berdasarkan program studi
  static async getBorrowingsByStudyProgram(filters = {}) {
    try {
      const { startDate, endDate, faculty } = filters;
      
      let query = `
        SELECT 
          m.faculty,
          m.study_program,
          COUNT(b.id) as total_borrowings,
          COUNT(CASE WHEN b.status = 'dipinjam' THEN 1 END) as active_borrowings,
          COUNT(CASE WHEN b.status = 'dikembalikan' THEN 1 END) as returned_books
        FROM borrowings b
        JOIN members m ON b.member_id = m.id
        WHERE 1=1
      `;

      let params = [];

      if (faculty) {
        query += ' AND m.faculty = ?';
        params.push(faculty);
      }

      const queryBuilder = this.buildDateRangeQuery(query, params, startDate, endDate, 'b.borrow_date');
      
      queryBuilder.query += `
        GROUP BY m.faculty, m.study_program
        ORDER BY m.faculty, total_borrowings DESC
      `;

      const [rows] = await db.execute(queryBuilder.query, queryBuilder.params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Laporan kategori buku yang paling sering dipinjam
  static async getBorrowingsByCategory(filters = {}) {
    try {
      const { startDate, endDate, limit = 10 } = filters;
      
      let query = `
        SELECT 
          bc.name as category_name,
          COUNT(b.id) as total_borrowings,
          COUNT(DISTINCT bk.id) as unique_books,
          COUNT(DISTINCT m.id) as unique_borrowers
        FROM borrowings b
        JOIN books bk ON b.book_id = bk.id
        LEFT JOIN book_categories bc ON bk.id = bc.book_id
        JOIN members m ON b.member_id = m.id
        WHERE bc.name IS NOT NULL
      `;

      const queryBuilder = this.buildDateRangeQuery(query, [], startDate, endDate, 'b.borrow_date');
      
      queryBuilder.query += `
        GROUP BY bc.name
        ORDER BY total_borrowings DESC
        LIMIT ?
      `;
      queryBuilder.params.push(parseInt(limit));

      const [rows] = await db.execute(queryBuilder.query, queryBuilder.params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Laporan tren peminjaman per bulan
  static async getBorrowingTrends(year) {
    try {
      const query = `
        SELECT 
          MONTH(borrow_date) as month,
          MONTHNAME(borrow_date) as month_name,
          COUNT(*) as total_borrowings,
          COUNT(CASE WHEN status = 'dikembalikan' THEN 1 END) as returned_count,
          COUNT(CASE WHEN status = 'dipinjam' THEN 1 END) as active_count,
          COUNT(CASE WHEN status = 'dibatalkan' THEN 1 END) as cancelled_count
        FROM borrowings
        WHERE YEAR(borrow_date) = ?
        GROUP BY MONTH(borrow_date)
        ORDER BY MONTH(borrow_date)
      `;

      const [rows] = await db.execute(query, [year]);
      
      // Fill missing months with zero values
      const fullYear = [];
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      for (let i = 1; i <= 12; i++) {
        const monthData = rows.find(row => row.month === i);
        fullYear.push({
          month: i,
          month_name: monthNames[i - 1],
          total_borrowings: monthData ? monthData.total_borrowings : 0,
          returned_count: monthData ? monthData.returned_count : 0,
          active_count: monthData ? monthData.active_count : 0,
          cancelled_count: monthData ? monthData.cancelled_count : 0
        });
      }

      return fullYear;
    } catch (error) {
      throw error;
    }
  }

  // Laporan member baru per bulan
  static async getNewMembersReport(year) {
    try {
      const query = `
        SELECT 
          MONTH(join_date) as month,
          MONTHNAME(join_date) as month_name,
          COUNT(*) as new_members,
          COUNT(CASE WHEN status = 'aktif' THEN 1 END) as active_members
        FROM members
        WHERE YEAR(join_date) = ?
        GROUP BY MONTH(join_date)
        ORDER BY MONTH(join_date)
      `;

      const [rows] = await db.execute(query, [year]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Summary report untuk periode tertentu
  static async getPeriodSummary(startDate, endDate) {
    try {
      const [
        borrowingStats,
        memberStats,
        bookStats,
        overdueStats
      ] = await Promise.all([
        // Borrowing statistics
        db.execute(`
          SELECT 
            COUNT(*) as total_borrowings,
            COUNT(CASE WHEN status = 'dipinjam' THEN 1 END) as active_borrowings,
            COUNT(CASE WHEN status = 'dikembalikan' THEN 1 END) as returned_borrowings,
            COUNT(CASE WHEN status = 'dibatalkan' THEN 1 END) as cancelled_borrowings
          FROM borrowings
          WHERE borrow_date BETWEEN ? AND ?
        `, [startDate, endDate]),

        // Member statistics
        db.execute(`
          SELECT 
            COUNT(DISTINCT member_id) as unique_borrowers,
            COUNT(*) / COUNT(DISTINCT member_id) as avg_borrowings_per_member
          FROM borrowings
          WHERE borrow_date BETWEEN ? AND ?
        `, [startDate, endDate]),

        // Book statistics
        db.execute(`
          SELECT 
            COUNT(DISTINCT book_id) as unique_books_borrowed,
            AVG(borrow_count) as avg_borrow_per_book
          FROM (
            SELECT book_id, COUNT(*) as borrow_count
            FROM borrowings
            WHERE borrow_date BETWEEN ? AND ?
            GROUP BY book_id
          ) as book_borrows
        `, [startDate, endDate]),

        // Overdue statistics
        db.execute(`
          SELECT 
            COUNT(*) as total_overdue,
            AVG(DATEDIFF(COALESCE(return_date, CURDATE()), due_date)) as avg_days_overdue
          FROM borrowings
          WHERE due_date < COALESCE(return_date, CURDATE())
          AND borrow_date BETWEEN ? AND ?
        `, [startDate, endDate])
      ]);

      return {
        period: { start_date: startDate, end_date: endDate },
        borrowing_stats: borrowingStats[0][0],
        member_stats: memberStats[0][0],
        book_stats: bookStats[0][0],
        overdue_stats: overdueStats[0][0]
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ReportModel;