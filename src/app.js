require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookRoutes = require('./routes/bookRoutes');
const publicBookRoutes = require('./routes/publicBookRoutes');
const { checkAndCreateFulltextIndex } = require('./config/checkFulltext');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check for FULLTEXT index at startup
(async () => {
  try {
    await checkAndCreateFulltextIndex();
    console.log('FULLTEXT index check completed');
  } catch (error) {
    console.error('Error during FULLTEXT index check:', error);
  }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/books', bookRoutes);
app.use('/api/books', publicBookRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Library API is running');
});

// Error handling
app.use((req, res, next) => {
  res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;