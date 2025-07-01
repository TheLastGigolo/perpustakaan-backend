const pool = require('../config/database');

const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

module.exports = {
  findUserByEmail
};