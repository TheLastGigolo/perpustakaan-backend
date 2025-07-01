// src/controllers/reportController.js
const { successResponse, errorResponse } = require('../utils/response');
const db = require('../config/database');

class ReportController {
  // Laporan Statistik Umum
  static async getDashboardStats(req, res) {
    try {
      const [
        totalBooksResult,
        totalMembersResult,
        activeBorrowingsResult,
        overdueBorrowingsResult
      ] = await Promise.all([
        db.execute('SELECT COUNT(*) as total FROM books WHERE is_active = 1'),
        db.execute('SELECT COUNT(*) as total FROM members WHERE status = "aktif"'),
        db.execute('SELECT COUNT(*) as total FROM borrowings WHERE status = "dipinjam"'),
        db.execute('SELECT COUNT(*) as total FROM borrowings WHERE status = "dipinjam" AND due_date < CURDATE()')
      ]);

      const stats = {
        total_books: totalBooksResult[0][0].total,
        total_members: totalMembersResult[0][0].total,
        active_borrowings: activeBorrowingsResult[0][0].total,
        overdue_borrowings: overdueBorrowingsResult[0][0].total
      };

      return successResponse(res, 200, stats);
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return errorResponse(res, 500, 'Gagal mengambil statistik dashboard');
    }
  }

  // Laporan Peminjaman
  static async getBorrowingReport(req, res) {
    try {
      const { 
        start_date, 
        end_date, 
        status, 
        member_id, 
        book_id,
        export_type = 'json' 
      } = req.query;

      let query = `
        SELECT 
          b.id,
          b.borrow_date,
          b.due_date,
          b.return_date,
          b.status,
          b.admin_notes,
          bk.title as book_title,
          bk.author as book_author,
          bk.isbn,
          m.name as member_name,
          m.member_code,
          u.name as admin_name,
          CASE 
            WHEN b.status = 'dipinjam' AND b.due_date < CURDATE() THEN 'Terlambat'
            WHEN b.status = 'dikembalikan' AND b.return_date > b.due_date THEN 'Terlambat (Sudah dikembalikan)'
            ELSE 'Normal'
          END as late_status,
          CASE 
            WHEN b.status = 'dipinjam' AND b.due_date < CURDATE() 
            THEN DATEDIFF(CURDATE(), b.due_date)
            WHEN b.status = 'dikembalikan' AND b.return_date > b.due_date 
            THEN DATEDIFF(b.return_date, b.due_date)
            ELSE 0
          END as days_late
        FROM borrowings b
        JOIN books bk ON b.book_id = bk.id
        JOIN members m ON b.member_id = m.id
        JOIN users u ON m.user_id = u.id
        LEFT JOIN users admin_u ON b.admin_id = admin_u.id
        WHERE 1=1
      `;

      const params = [];

      if (start_date) {
        query += ' AND b.borrow_date >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND b.borrow_date <= ?';
        params.push(end_date);
      }

      if (status) {
        query += ' AND b.status = ?';
        params.push(status);
      }

      if (member_id) {
        query += ' AND b.member_id = ?';
        params.push(member_id);
      }

      if (book_id) {
        query += ' AND b.book_id = ?';
        params.push(book_id);
      }

      query += ' ORDER BY b.borrow_date DESC';

      const [rows] = await db.execute(query, params);

      // Summary statistics
      const summary = {
        total_borrowings: rows.length,
        by_status: {
          antri: rows.filter(r => r.status === 'antri').length,
          dipinjam: rows.filter(r => r.status === 'dipinjam').length,
          dikembalikan: rows.filter(r => r.status === 'dikembalikan').length,
          dibatalkan: rows.filter(r => r.status === 'dibatalkan').length
        },
        overdue_count: rows.filter(r => r.late_status.includes('Terlambat')).length
      };

      return successResponse(res, 200, {
        summary,
        borrowings: rows,
        period: { start_date, end_date }
      });
    } catch (error) {
      console.error('Error getting borrowing report:', error);
      return errorResponse(res, 500, 'Gagal mengambil laporan peminjaman');
    }
  }

  // Laporan Buku Populer
  static async getPopularBooksReport(req, res) {
    try {
      const { limit = 10, start_date, end_date } = req.query;

      let query = `
        SELECT 
          b.id,
          b.title,
          b.author,
          b.isbn,
          b.publisher,
          b.publication_year,
          b.stock,
          COUNT(br.id) as total_borrowed,
          COUNT(CASE WHEN br.status = 'dipinjam' THEN 1 END) as currently_borrowed,
          COUNT(CASE WHEN br.status = 'dikembalikan' THEN 1 END) as total_returned,
          GROUP_CONCAT(DISTINCT bc.name) as categories
        FROM books b
        LEFT JOIN borrowings br ON b.id = br.book_id
        LEFT JOIN book_categories bc ON b.id = bc.book_id
        WHERE b.is_active = 1
      `;

      const params = [];

      if (start_date) {
        query += ' AND br.borrow_date >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND br.borrow_date <= ?';
        params.push(end_date);
      }

      query += `
        GROUP BY b.id
        ORDER BY total_borrowed DESC, b.title ASC
        LIMIT ?
      `;
      params.push(parseInt(limit));

      const [rows] = await db.execute(query, params);

      return successResponse(res, 200, {
        popular_books: rows,
        period: { start_date, end_date }
      });
    } catch (error) {
      console.error('Error getting popular books report:', error);
      return errorResponse(res, 500, 'Gagal mengambil laporan buku populer');
    }
  }

  // Laporan Member Aktif
  static async getActiveMembersReport(req, res) {
    try {
      const { limit = 10, start_date, end_date } = req.query;

      let query = `
        SELECT 
          m.id,
          u.name as member_name,
          m.member_code,
          m.nim,
          m.faculty,
          m.study_program,
          m.join_date,
          COUNT(br.id) as total_borrowings,
          COUNT(CASE WHEN br.status = 'dipinjam' THEN 1 END) as active_borrowings,
          COUNT(CASE WHEN br.status = 'dikembalikan' THEN 1 END) as returned_books,
          COUNT(CASE WHEN br.status = 'dipinjam' AND br.due_date < CURDATE() THEN 1 END) as overdue_books,
          MAX(br.borrow_date) as last_borrow_date
        FROM members m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN borrowings br ON m.id = br.member_id
        WHERE m.status = 'aktif'
      `;

      const params = [];

      if (start_date) {
        query += ' AND br.borrow_date >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND br.borrow_date <= ?';
        params.push(end_date);
      }

      query += `
        GROUP BY m.id
        ORDER BY total_borrowings DESC, last_borrow_date DESC
        LIMIT ?
      `;
      params.push(parseInt(limit));

      const [rows] = await db.execute(query, params);

      return successResponse(res, 200, {
        active_members: rows,
        period: { start_date, end_date }
      });
    } catch (error) {
      console.error('Error getting active members report:', error);
      return errorResponse(res, 500, 'Gagal mengambil laporan member aktif');
    }
  }

  // Laporan Keterlambatan
  static async getOverdueReport(req, res) {
    try {
      const query = `
        SELECT 
          b.id,
          b.borrow_date,
          b.due_date,
          bk.title as book_title,
          bk.author as book_author,
          bk.isbn,
          m.member_code,
          u.name as member_name,
          m.phone as member_phone,
          DATEDIFF(CURDATE(), b.due_date) as days_overdue,
          CASE 
            WHEN DATEDIFF(CURDATE(), b.due_date) <= 7 THEN 'Ringan (1-7 hari)'
            WHEN DATEDIFF(CURDATE(), b.due_date) <= 14 THEN 'Sedang (8-14 hari)'
            ELSE 'Berat (>14 hari)'
          END as overdue_category
        FROM borrowings b
        JOIN books bk ON b.book_id = bk.id
        JOIN members m ON b.member_id = m.id
        JOIN users u ON m.user_id = u.id
        WHERE b.status = 'dipinjam' 
        AND b.due_date < CURDATE()
        ORDER BY days_overdue DESC, b.due_date ASC
      `;

      const [rows] = await db.execute(query);

      const summary = {
        total_overdue: rows.length,
        by_category: {
          ringan: rows.filter(r => r.overdue_category.includes('Ringan')).length,
          sedang: rows.filter(r => r.overdue_category.includes('Sedang')).length,
          berat: rows.filter(r => r.overdue_category.includes('Berat')).length
        }
      };

      return successResponse(res, 200, {
        summary,
        overdue_borrowings: rows
      });
    } catch (error) {
      console.error('Error getting overdue report:', error);
      return errorResponse(res, 500, 'Gagal mengambil laporan keterlambatan');
    }
  }

  // Laporan Stok Buku
  static async getStockReport(req, res) {
    try {
      const { low_stock_threshold = 5 } = req.query;

      const query = `
        SELECT 
          b.id,
          b.title,
          b.author,
          b.isbn,
          b.publisher,
          b.publication_year,
          b.stock,
          COUNT(br.id) as total_borrowings,
          COUNT(CASE WHEN br.status = 'dipinjam' THEN 1 END) as currently_borrowed,
          (b.stock + COUNT(CASE WHEN br.status = 'dipinjam' THEN 1 END)) as total_copies,
          CASE 
            WHEN b.stock = 0 THEN 'Habis'
            WHEN b.stock <= ? THEN 'Stok Rendah'
            ELSE 'Stok Cukup'
          END as stock_status,
          GROUP_CONCAT(DISTINCT bc.name) as categories
        FROM books b
        LEFT JOIN borrowings br ON b.id = br.book_id
        LEFT JOIN book_categories bc ON b.id = bc.book_id
        WHERE b.is_active = 1
        GROUP BY b.id
        ORDER BY b.stock ASC, total_borrowings DESC
      `;

      const [rows] = await db.execute(query, [parseInt(low_stock_threshold)]);

      const summary = {
        total_books: rows.length,
        out_of_stock: rows.filter(r => r.stock_status === 'Habis').length,
        low_stock: rows.filter(r => r.stock_status === 'Stok Rendah').length,
        adequate_stock: rows.filter(r => r.stock_status === 'Stok Cukup').length
      };

      return successResponse(res, 200, {
        summary,
        books: rows,
        low_stock_threshold: parseInt(low_stock_threshold)
      });
    } catch (error) {
      console.error('Error getting stock report:', error);
      return errorResponse(res, 500, 'Gagal mengambil laporan stok buku');
    }
  }

  // Laporan Bulanan
  static async getMonthlyReport(req, res) {
    try {
      const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      const [
        borrowingStats,
        popularBooks,
        activeMembers,
        overdueStats
      ] = await Promise.all([
        // Statistik peminjaman bulanan
        db.execute(`
          SELECT 
            DATE(borrow_date) as date,
            COUNT(*) as total_borrowings,
            COUNT(CASE WHEN status = 'dipinjam' THEN 1 END) as borrowed,
            COUNT(CASE WHEN status = 'dikembalikan' THEN 1 END) as returned
          FROM borrowings 
          WHERE borrow_date BETWEEN ? AND ?
          GROUP BY DATE(borrow_date)
          ORDER BY date
        `, [startDate, endDate]),

        // Buku populer bulan ini
        db.execute(`
          SELECT b.title, b.author, COUNT(br.id) as borrow_count
          FROM books b
          JOIN borrowings br ON b.id = br.book_id
          WHERE br.borrow_date BETWEEN ? AND ?
          GROUP BY b.id
          ORDER BY borrow_count DESC
          LIMIT 5
        `, [startDate, endDate]),

        // Member aktif bulan ini
        db.execute(`
          SELECT u.name, m.member_code, COUNT(br.id) as borrow_count
          FROM members m
          JOIN users u ON m.user_id = u.id
          JOIN borrowings br ON m.id = br.member_id
          WHERE br.borrow_date BETWEEN ? AND ?
          GROUP BY m.id
          ORDER BY borrow_count DESC
          LIMIT 5
        `, [startDate, endDate]),

        // Statistik keterlambatan
        db.execute(`
          SELECT 
            COUNT(*) as total_overdue,
            AVG(DATEDIFF(COALESCE(return_date, CURDATE()), due_date)) as avg_days_late
          FROM borrowings
          WHERE due_date < COALESCE(return_date, CURDATE())
          AND borrow_date BETWEEN ? AND ?
        `, [startDate, endDate])
      ]);

      return successResponse(res, 200, {
        period: { year: parseInt(year), month: parseInt(month) },
        daily_borrowings: borrowingStats[0],
        popular_books: popularBooks[0],
        active_members: activeMembers[0],
        overdue_stats: overdueStats[0][0] || { total_overdue: 0, avg_days_late: 0 }
      });
    } catch (error) {
      console.error('Error getting monthly report:', error);
      return errorResponse(res, 500, 'Gagal mengambil laporan bulanan');
    }
  }
}

module.exports = ReportController;