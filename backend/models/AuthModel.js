const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const findByUsernameOrEmail = async (identifier) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [identifier, identifier]
  );
  return rows[0] || null;
};

const findExistingUser = async (username, email) => {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE username = ? OR email = ?',
    [username, email]
  );
  return rows[0] || null;
};

const createUser = async (username, email, password) => {
  const hash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, hash]
  );
  return result.insertId;
};

const verifyPassword = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};

module.exports = { findByUsernameOrEmail, findExistingUser, createUser, verifyPassword };
