require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookRoutes = require('./routes/bookRoutes');
const memberRoutes = require('./routes/memberRoutes');
const borrowingRoutes = require('./routes/borrowingRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/covers', express.static('public/covers'));
app.use('/uploads', express.static('uploads')); // Untuk akses file upload

// Add error handler for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      statusCode: 400,
      status: 'Bad Request',
      message: 'Format JSON tidak valid'
    });
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/books', bookRoutes);
app.use('/api/admin/members', memberRoutes); // Tambahkan ini
app.use('/api/admin/borrowings', borrowingRoutes); // Register the borrowing routes
app.use('/api/reports', reportRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('API Perpustakaan Berjalan');
});

// Error handling
app.use((req, res, next) => {
  res.status(404).json({ status: 'error', message: 'Endpoint tidak ditemukan' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

module.exports = app;