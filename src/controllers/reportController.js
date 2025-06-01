const Borrowing = require('../models/borrowingModel');
const { successResponse, errorResponse } = require('../utils/response');

class ReportController {
  async getBorrowingReports(req, res) {
    try {
      const { search = '', status = 'all', page = 1, limit = 10 } = req.query;
      
      const result = await Borrowing.getBorrowingReports({
        search,
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      successResponse(res, 'Laporan peminjaman berhasil ditemukan', result);
    } catch (error) {
      console.error(error);
      errorResponse(res, 'Gagal mengambil laporan peminjaman', 500);
    }
  }
}

module.exports = ReportController;