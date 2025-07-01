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
        return errorResponse(res, 400, 'Status tidak valid');
      }

      const result = await Borrowing.getAllBorrowings({
        search: search?.trim(),
        status,
        page: validatedPage,
        limit: validatedLimit
      });
      
      return successResponse(res, 200, 'Daftar peminjaman berhasil ditemukan', result);
    } catch (error) {
      console.error('Error getting all borrowings:', error);
      return errorResponse(res, 500, 'Gagal mengambil daftar peminjaman');
    }
  }

  static async getBorrowingById(req, res) {
    try {
      const { id } = req.params;
      const borrowing = await Borrowing.getBorrowingById(id);
      
      if (!borrowing) {
        return errorResponse(res, 404, 'Data peminjaman tidak ditemukan');
      }
      
      successResponse(res, 200, 'Data peminjaman berhasil ditemukan', borrowing);
    } catch (error) {
      errorResponse(res, 500, 'Gagal mengambil data peminjaman');
    }
  }

  static async updateBorrowingStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;

      // Validate allowed status values
      const validStatuses = ['antri', 'dipinjam', 'dikembalikan', 'dibatalkan'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 400, 'Status tidak valid');
      }

      const borrowing = await Borrowing.getBorrowingById(id);
      if (!borrowing) {
        return errorResponse(res, 404, 'Data peminjaman tidak ditemukan');
      }

      // Get book data first to handle stock updates
      const book = await Book.getBookById(borrowing.book_id);
      if (!book) {
        return errorResponse(res, 404, 'Data buku tidak ditemukan');
      }

      // Define valid status transitions
      const validTransitions = {
        antri: ['dipinjam', 'dibatalkan'],
        dipinjam: ['dikembalikan'],
        dikembalikan: [],
        dibatalkan: []
      };

      if (!validTransitions[borrowing.status].includes(status)) {
        return errorResponse(res, 400, `Tidak dapat mengubah status dari ${borrowing.status} ke ${status}`);
      }

      // Handle stock updates based on status change
      if (status === 'dipinjam') {
        if (book.stock < 1) {
          return errorResponse(res, 400, 'Stok buku tidak tersedia');
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

      return successResponse(res, 200, 'Status peminjaman berhasil diperbarui', updatedBorrowing);

    } catch (error) {
      console.error('Error updating borrowing status:', error);
      return errorResponse(res, 500, 'Gagal memperbarui status peminjaman');
    }
  }

  static async createBorrowing(req, res) {
    try {
      const { book_id, member_id, borrow_date, due_date } = req.body;
      
      // Validate required fields
      if (!book_id || !member_id || !borrow_date || !due_date) {
        return errorResponse(res, 400, 'Semua field harus diisi');
      }
      
      // Validate dates
      const borrowDate = new Date(borrow_date);
      const dueDate = new Date(due_date);
      
      if (borrowDate >= dueDate) {
        return errorResponse(res, 400, 'Tanggal pengembalian harus setelah tanggal peminjaman');
      }
      
      // Calculate difference in days
      const diffTime = Math.abs(dueDate - borrowDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        return errorResponse(res, 400, 'Maksimal peminjaman adalah 7 hari');
      }
      
      // Validate member exists
      const member = await Member.getMemberById(member_id);
      if (!member || member.status !== 'aktif') {
        return errorResponse(res, 400, 'Anggota tidak valid atau tidak aktif');
      }
      
      // Validate book exists and available
      const book = await Book.getBookById(book_id);
      if (!book || !book.is_active || book.stock < 1) {
        return errorResponse(res, 400, 'Buku tidak tersedia untuk dipinjam');
      }
      
      const borrowing = await Borrowing.createBorrowing(
        book_id,
        member_id,
        borrow_date,
        due_date
      );
      
      successResponse(res, 201, 'Peminjaman berhasil diajukan', borrowing);
    } catch (error) {
      console.error(error);
      errorResponse(res, 500, 'Gagal membuat peminjaman');
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
      
      successResponse(res, 200, 'Daftar peminjaman anggota berhasil ditemukan', result);
    } catch (error) {
      errorResponse(res, 500, 'Gagal mengambil daftar peminjaman anggota');
    }
  }

  static async deleteBorrowing(req, res) {
    try {
      const { id } = req.params;
      const borrowing = await Borrowing.getBorrowingById(id);
      
      if (!borrowing) {
        return errorResponse(res, 404, 'Data peminjaman tidak ditemukan');
      }
      
      if (borrowing.status === 'dipinjam') {
        return errorResponse(res, 400, 'Tidak bisa menghapus peminjaman yang sedang dipinjam');
      }
      
      await Borrowing.deleteBorrowing(id);
      return successResponse(res, 200, 'Peminjaman berhasil dihapus', { id });
    } catch (error) {
      console.error('Error deleting borrowing:', error);
      return errorResponse(res, 500, 'Gagal menghapus peminjaman');
    }
  }
}

module.exports = BorrowingController;