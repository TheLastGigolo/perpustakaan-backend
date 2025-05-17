const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/response');
const userModel = require('../models/userModel');
const jwtConfig = require('../config/jwt');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validasi input
    if (!email || !password) {
      return errorResponse(res, 400, 'Email dan password harus diisi');
    }
    
    // Cari user berdasarkan email
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return errorResponse(res, 401, 'Email atau password salah');
    }
    
    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Email atau password salah');
    }
    
    // Buat token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
    
    // Hilangkan password sebelum mengirim response
    delete user.password;
    
    return successResponse(res, 200, 'Login berhasil', { user, token });
  } catch (error) {
    console.error('Error saat login:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan server');
  }
};

module.exports = { login };