const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// ─── Stats ────────────────────────────────────────────────────────────────────

const getStats = async () => {
  const [[{ total_users }]]       = await pool.query('SELECT COUNT(*) as total_users FROM users WHERE role="user"');
  const [[{ total_challenges }]]  = await pool.query('SELECT COUNT(*) as total_challenges FROM challenges');
  const [[{ total_categories }]]  = await pool.query('SELECT COUNT(*) as total_categories FROM categories');
  const [[{ total_solves }]]      = await pool.query('SELECT COUNT(*) as total_solves FROM solves');
  const [[{ total_submissions }]] = await pool.query('SELECT COUNT(*) as total_submissions FROM submissions');
  return { total_users, total_challenges, total_categories, total_solves, total_submissions };
};

// ─── Users ────────────────────────────────────────────────────────────────────

const getAllUsers = async (search) => {
  let sql = `
    SELECT u.id, u.username, u.email, u.role, u.is_banned,
           u.avatar_type, u.avatar_url, u.avatar_preset,
           u.total_points, u.created_at,
           COUNT(DISTINCT s.id) AS solve_count
    FROM users u LEFT JOIN solves s ON s.user_id = u.id
  `;
  const params = [];
  if (search) {
    sql += ' WHERE u.username LIKE ? OR u.email LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' GROUP BY u.id ORDER BY u.created_at DESC';
  const [rows] = await pool.query(sql, params);
  return rows;
};

const findUserById = async (id) => {
  const [rows] = await pool.query('SELECT is_banned FROM users WHERE id = ?', [id]);
  return rows[0] || null;
};

const toggleBanUser = async (id, newBan) => {
  await pool.query('UPDATE users SET is_banned = ? WHERE id = ?', [newBan, id]);
};

const resetUserProgress = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM solves WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM submissions WHERE user_id = ?', [id]);
    await conn.query('UPDATE users SET total_points = 0 WHERE id = ?', [id]);
    await conn.query('UPDATE challenges c SET solve_count = (SELECT COUNT(*) FROM solves s WHERE s.challenge_id = c.id)');
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const removeUser = async (id) => {
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
};

const createAdminUser = async (username, email, password) => {
  const hash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?)',
    [username, email, hash, 'admin']
  );
  return result.insertId;
};

// ─── Challenges ───────────────────────────────────────────────────────────────

const getAllChallenges = async () => {
  const [rows] = await pool.query(`
    SELECT c.*, cat.title AS category_name
    FROM challenges c JOIN categories cat ON cat.id = c.category_id
    ORDER BY c.created_at DESC
  `);
  return rows;
};

const insertChallenge = async ({ title, description, category_id, difficulty, points, flag, hint, attachment_url, attachment_name }) => {
  const [result] = await pool.query(
    'INSERT INTO challenges (title,description,category_id,difficulty,points,flag,hint,attachment_url,attachment_name) VALUES (?,?,?,?,?,?,?,?,?)',
    [title, description, category_id, difficulty, parseInt(points), flag, hint || null, attachment_url, attachment_name]
  );
  return result.insertId;
};

const updateChallenge = async (id, fields, vals) => {
  await pool.query(`UPDATE challenges SET ${fields.join(',')} WHERE id=?`, [...vals, id]);
};

const removeChallenge = async (id) => {
  await pool.query('DELETE FROM challenges WHERE id = ?', [id]);
};

// ─── Categories ───────────────────────────────────────────────────────────────

const getAllCategories = async (search) => {
  let sql = 'SELECT * FROM categories';
  const params = [];
  if (search) { sql += ' WHERE title LIKE ?'; params.push(`%${search}%`); }
  sql += ' ORDER BY title';
  const [rows] = await pool.query(sql, params);
  return rows;
};

const insertCategory = async (title, icon, color, description) => {
  const [result] = await pool.query(
    'INSERT INTO categories (title,icon,color,description) VALUES (?,?,?,?)',
    [title, icon || '🗂', color || '#00ffcc', description || '']
  );
  return result.insertId;
};

const removeCategory = async (id) => {
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
};

// ─── Activity ─────────────────────────────────────────────────────────────────

const getRecentActivity = async () => {
  const [rows] = await pool.query(`
    SELECT sub.id, sub.submitted_flag, sub.is_correct, sub.submitted_at,
           u.username, c.title AS challenge_title
    FROM submissions sub
    JOIN users u ON u.id = sub.user_id
    JOIN challenges c ON c.id = sub.challenge_id
    ORDER BY sub.submitted_at DESC LIMIT 200
  `);
  return rows;
};

// ─── Events ───────────────────────────────────────────────────────────────────

const getAllEvents = async () => {
  const [rows] = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
  return rows;
};

const insertEvent = async (title, description, start_time, end_time) => {
  const [result] = await pool.query(
    'INSERT INTO events (title,description,start_time,end_time) VALUES (?,?,?,?)',
    [title, description || '', start_time, end_time]
  );
  return result.insertId;
};

module.exports = {
  getStats,
  getAllUsers, findUserById, toggleBanUser, resetUserProgress, removeUser, createAdminUser,
  getAllChallenges, insertChallenge, updateChallenge, removeChallenge,
  getAllCategories, insertCategory, removeCategory,
  getRecentActivity,
  getAllEvents, insertEvent,
};
