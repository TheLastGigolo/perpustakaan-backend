const pool = require('../config/database');
const { successResponse } = require('../utils/response');
// controllers/adminController.js
const { getRecommendedBooks } = require('../utils/ahpCalculator');

const getDashboardData = async (req, res) => {
  try {
    const [totalBooks, totalMembers, borrowedBooks, queuedBorrows] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM books'),
      pool.query('SELECT COUNT(*) as total FROM members'),
      pool.query("SELECT COUNT(*) as total FROM borrowings WHERE status = 'dipinjam'"),
      pool.query("SELECT COUNT(*) as total FROM borrowings WHERE status = 'antri'")
    ]);

    const popularBooks = await getRecommendedBooks();

    res.json({
      status: 'success',
      data: {
        total_books: totalBooks[0][0].total,
        total_members: totalMembers[0][0].total,
        borrowed_books: borrowedBooks[0][0].total,
        queued_borrows: queuedBorrows[0][0].total,
        popular_books: popularBooks.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          score: book.ahp_score.toFixed(2),
          borrow_count: book.borrow_count,
          stock: book.stock
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = { getDashboardData };