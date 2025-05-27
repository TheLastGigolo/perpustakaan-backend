const Borrowing = require('../models/borrowingModel');
const Book = require('../models/bookModel');
const Member = require('../models/memberModel');
const { successResponse, errorResponse } = require('../utils/response');

class BorrowingController {
  static async getAllBorrowings(req, res) {
    try {
      const { search, status, page = 1, limit = 10 } = req.query;

      // Validate page and limit
      const validatedPage = Math.max(1, parseInt(page) || 1);
      const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

      // Validate status if provided
      if (status && !['antri', 'dipinjam', 'dikembalikan', 'dibatalkan'].includes(status)) {
        return errorResponse(res, 'Status tidak valid', 400);
      }

      const result = await Borrowing.getAllBorrowings({
        search: search?.trim(),
        status,
        page: validatedPage,
        limit: validatedLimit
      });
      
      return successResponse(res, 'Daftar peminjaman berhasil ditemukan', result);
    } catch (error) {
      console.error('Error getting all borrowings:', error);
      return errorResponse(res, 'Gagal mengambil daftar peminjaman', 500);
    }
  }

  static async getBorrowingById(req, res) {
    try {
      const { id } = req.params;
      const borrowing = await Borrowing.getBorrowingById(id);
      
      if (!borrowing) {
        return errorResponse(res, 'Data peminjaman tidak ditemukan', 404);
      }
      
      successResponse(res, 'Data peminjaman berhasil ditemukan', borrowing);
    } catch (error) {
      errorResponse(res, 'Gagal mengambil data peminjaman', 500);
    }
  }

  static async updateBorrowingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;

      // Validate allowed status values
      const validStatuses = ['antri', 'dipinjam', 'dikembalikan', 'dibatalkan'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 'Status tidak valid', 400);
      }

      const borrowing = await Borrowing.getBorrowingById(id);
      if (!borrowing) {
        return errorResponse(res, 'Data peminjaman tidak ditemukan', 404);
      }

      // Get book data first to handle stock updates
      const book = await Book.getBookById(borrowing.book_id);
      if (!book) {
        return errorResponse(res, 'Data buku tidak ditemukan', 404);
      }

      // Define valid status transitions
      const validTransitions = {
        antri: ['dipinjam', 'dibatalkan'],
        dipinjam: ['dikembalikan'],
        dikembalikan: [],
        dibatalkan: []
      };

      if (!validTransitions[borrowing.status].includes(status)) {
        return errorResponse(res, `Tidak dapat mengubah status dari ${borrowing.status} ke ${status}`, 400);
      }

      // Handle stock updates based on status change
      if (status === 'dipinjam') {
        if (book.stock < 1) {
          return errorResponse(res, 'Stok buku tidak tersedia', 400);
        }
        await Book.updateBook(borrowing.book_id, { stock: book.stock - 1 });
      } 
      
      if (status === 'dikembalikan' || status === 'dibatalkan') {
        // Only increase stock if previous status was 'dipinjam'
        if (borrowing.status === 'dipinjam') {
          await Book.updateBook(borrowing.book_id, { stock: book.stock + 1 });
        }
      }

      const updatedBorrowing = await Borrowing.updateBorrowingStatus(id, status, admin_notes);

      return successResponse(res, 'Status peminjaman berhasil diperbarui', updatedBorrowing);

    } catch (error) {
      console.error('Error updating borrowing status:', error);
      return errorResponse(res, 'Gagal memperbarui status peminjaman', 500);
    }
  }

  static async createBorrowing(req, res) {
    try {
      const { book_id, member_id, borrow_date, due_date } = req.body;
      
      // Validate member exists
      const member = await Member.getMemberById(member_id);
      if (!member || member.status !== 'aktif') {
        return errorResponse(res, 'Anggota tidak valid atau tidak aktif', 400);
      }
      
      // Validate book exists and available
      const book = await Book.getBookById(book_id);
      if (!book || !book.is_active || book.stock < 1) {
        return errorResponse(res, 'Buku tidak tersedia untuk dipinjam', 400);
      }
      
      const borrowing = await Borrowing.createBorrowing(
        book_id,
        member_id,
        borrow_date,
        due_date
      );
      
      successResponse(res, 'Peminjaman berhasil diajukan', borrowing, 201);
    } catch (error) {
      console.error(error);
      errorResponse(res, 'Gagal membuat peminjaman', 500);
    }
  }

  static async getMemberBorrowings(req, res) {
    try {
      const { memberId } = req.params;
      const { status, page = 1, limit = 10 } = req.query;
      
      const result = await Borrowing.getBorrowingsByMember(memberId, {
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      successResponse(res, 'Daftar peminjaman anggota berhasil ditemukan', result);
    } catch (error) {
      errorResponse(res, 'Gagal mengambil daftar peminjaman anggota', 500);
    }
  }

  static async deleteBorrowing(req, res) {
    try {
      const { id } = req.params;
      const borrowing = await Borrowing.getBorrowingById(id);
      
      if (!borrowing) {
        return errorResponse(res, 'Data peminjaman tidak ditemukan', 404);
      }
      
      if (borrowing.status === 'dipinjam') {
        return errorResponse(res, 'Tidak bisa menghapus peminjaman yang sedang dipinjam', 400);
      }
      
      await Borrowing.deleteBorrowing(id);
      return successResponse(res, 'Peminjaman berhasil dihapus');
    } catch (error) {
      console.error('Error deleting borrowing:', error);
      return errorResponse(res, 'Gagal menghapus peminjaman', 500);
    }
  }
}

module.exports = BorrowingController;