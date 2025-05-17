// utils/ahpCalculator.js
const pool = require('../config/database');

const calculateAHP = (book) => {
  // Kriteria dan bobot (sesuaikan dengan kebutuhan)
  const weights = {
    borrow_frequency: 0.5,  // Frekuensi peminjaman (50%)
    stock_availability: 0.3, // Ketersediaan stok (30%)
    recency: 0.2            // Kebaruan buku (20%)
  };

  // Normalisasi nilai
  const borrowScore = (book.borrow_count / 100) * weights.borrow_frequency;
  const availabilityScore = (book.stock > 0 ? 1 : 0) * weights.stock_availability;
  
  // Hitung kebaruan (misal: buku < 1 tahun = 1, >3 tahun = 0.2)
  const currentYear = new Date().getFullYear();
  const yearDiff = currentYear - book.publication_year;
  const recencyScore = (yearDiff <= 1 ? 1 : yearDiff <= 3 ? 0.5 : 0.2) * weights.recency;

  // Total skor AHP
  return borrowScore + availabilityScore + recencyScore;
};

const getRecommendedBooks = async () => {
  try {
    const [books] = await pool.query(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.publication_year,
        b.stock,
        COUNT(br.id) as borrow_count,
        GROUP_CONCAT(DISTINCT bc.name) as categories
      FROM books b
      LEFT JOIN borrowings br ON b.id = br.book_id
      LEFT JOIN book_category_mappings bcm ON b.id = bcm.book_id
      LEFT JOIN book_categories bc ON bcm.category_id = bc.id
      GROUP BY b.id
    `);

    // Hitung skor AHP untuk setiap buku
    const booksWithScores = books.map(book => ({
      ...book,
      ahp_score: calculateAHP(book)
    }));

    // Urutkan berdasarkan skor tertinggi
    return booksWithScores.sort((a, b) => b.ahp_score - a.ahp_score).slice(0, 5);
    
  } catch (error) {
    console.error('AHP calculation error:', error);
    return [];
  }
};

module.exports = { getRecommendedBooks };