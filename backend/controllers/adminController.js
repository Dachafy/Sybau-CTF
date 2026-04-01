const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const getStats = async (req, res) => {
  try {
    const [[{ total_users }]] = await pool.query('SELECT COUNT(*) as total_users FROM users WHERE role="user"');
    const [[{ total_challenges }]] = await pool.query('SELECT COUNT(*) as total_challenges FROM challenges');
    const [[{ total_categories }]] = await pool.query('SELECT COUNT(*) as total_categories FROM categories');
    const [[{ total_solves }]] = await pool.query('SELECT COUNT(*) as total_solves FROM solves');
    const [[{ total_submissions }]] = await pool.query('SELECT COUNT(*) as total_submissions FROM submissions');
    res.json({ total_users, total_challenges, total_categories, total_solves, total_submissions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT u.id, u.username, u.email, u.role, u.is_banned,
             u.avatar_type, u.avatar_url, u.avatar_preset,
             u.total_points, u.created_at,
             COUNT(DISTINCT s.id) AS solve_count
      FROM users u LEFT JOIN solves s ON s.user_id = u.id
    `;
    const params = [];
    if (search) { sql += ' WHERE u.username LIKE ? OR u.email LIKE ?'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' GROUP BY u.id ORDER BY u.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Cannot ban yourself' });
    const [rows] = await pool.query('SELECT is_banned FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const newBan = rows[0].is_banned ? 0 : 1;
    await pool.query('UPDATE users SET is_banned = ? WHERE id = ?', [newBan, id]);
    res.json({ message: newBan ? 'User banned' : 'User unbanned', is_banned: newBan });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

const resetUser = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();
    await conn.query('DELETE FROM solves WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM submissions WHERE user_id = ?', [id]);
    await conn.query('UPDATE users SET total_points = 0 WHERE id = ?', [id]);
    await conn.query(`UPDATE challenges c SET solve_count = (SELECT COUNT(*) FROM solves s WHERE s.challenge_id = c.id)`);
    await conn.commit();
    res.json({ message: 'User progress reset' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Failed to reset user' });
  } finally {
    conn.release();
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

const getChallenges = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, cat.title AS category_name
      FROM challenges c JOIN categories cat ON cat.id = c.category_id
      ORDER BY c.created_at DESC
    `);
    res.json({ challenges: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
};

const createChallenge = async (req, res) => {
  try {
    const { title, description, category_id, difficulty, points, flag, hint } = req.body;
    if (!title || !description || !category_id || !difficulty || !points || !flag)
      return res.status(400).json({ error: 'title, description, category, difficulty, points, flag all required' });
    let attachment_url = null, attachment_name = null;
    if (req.file) {
      attachment_url = `/uploads/attachments/${req.file.filename}`;
      attachment_name = req.file.originalname;
    }
    const [result] = await pool.query(
      'INSERT INTO challenges (title,description,category_id,difficulty,points,flag,hint,attachment_url,attachment_name) VALUES (?,?,?,?,?,?,?,?,?)',
      [title, description, category_id, difficulty, parseInt(points), flag, hint || null, attachment_url, attachment_name]
    );
    res.status(201).json({ message: 'Challenge created', id: result.insertId });
  } catch (err) {
    console.error('[Admin] Create challenge:', err);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
};

const updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, difficulty, points, flag, hint, is_active } = req.body;
    const fields = [], vals = [];
    if (title) { fields.push('title=?'); vals.push(title); }
    if (description) { fields.push('description=?'); vals.push(description); }
    if (category_id) { fields.push('category_id=?'); vals.push(category_id); }
    if (difficulty) { fields.push('difficulty=?'); vals.push(difficulty); }
    if (points) { fields.push('points=?'); vals.push(parseInt(points)); }
    if (flag) { fields.push('flag=?'); vals.push(flag); }
    if (hint !== undefined) { fields.push('hint=?'); vals.push(hint); }
    if (is_active !== undefined) { fields.push('is_active=?'); vals.push(is_active ? 1 : 0); }
    if (req.file) {
      fields.push('attachment_url=?', 'attachment_name=?');
      vals.push(`/uploads/attachments/${req.file.filename}`, req.file.originalname);
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(id);
    await pool.query(`UPDATE challenges SET ${fields.join(',')} WHERE id=?`, vals);
    res.json({ message: 'Challenge updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update challenge' });
  }
};

const deleteChallenge = async (req, res) => {
  try {
    await pool.query('DELETE FROM challenges WHERE id = ?', [req.params.id]);
    res.json({ message: 'Challenge deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
};

const getCategories = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM categories';
    const params = [];
    if (search) { sql += ' WHERE title LIKE ?'; params.push(`%${search}%`); }
    sql += ' ORDER BY title';
    const [rows] = await pool.query(sql, params);
    res.json({ categories: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { title, icon, color, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const [result] = await pool.query(
      'INSERT INTO categories (title,icon,color,description) VALUES (?,?,?,?)',
      [title, icon || '🗂', color || '#00ffcc', description || '']
    );
    res.status(201).json({ message: 'Category created', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Category exists' });
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Cannot delete — may have challenges attached' });
  }
};

const getActivity = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT sub.id, sub.submitted_flag, sub.is_correct, sub.submitted_at,
             u.username, c.title AS challenge_title
      FROM submissions sub
      JOIN users u ON u.id = sub.user_id
      JOIN challenges c ON c.id = sub.challenge_id
      ORDER BY sub.submitted_at DESC LIMIT 200
    `);
    res.json({ activity: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

const getEvents = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
    res.json({ events: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, start_time, end_time } = req.body;
    if (!title || !start_time || !end_time)
      return res.status(400).json({ error: 'title, start_time, end_time required' });
    const [result] = await pool.query(
      'INSERT INTO events (title,description,start_time,end_time) VALUES (?,?,?,?)',
      [title, description || '', start_time, end_time]
    );
    res.status(201).json({ message: 'Event created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
};

const createAdminUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?)',
      [username, email, hash, 'admin']
    );
    res.status(201).json({ message: 'Admin created', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'User already exists' });
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

module.exports = {
  getStats, getUsers, banUser, resetUser, deleteUser,
  getChallenges, createChallenge, updateChallenge, deleteChallenge,
  getCategories, createCategory, deleteCategory,
  getActivity, getEvents, createEvent, createAdminUser
};
