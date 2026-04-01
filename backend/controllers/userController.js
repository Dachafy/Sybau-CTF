const { pool } = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.avatar_type, u.avatar_url,
             u.avatar_preset, u.total_points, u.created_at,
             COUNT(DISTINCT s.id) AS solve_count
      FROM users u
      LEFT JOIN solves s ON s.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `, [req.user.id]);

    const [submissions] = await pool.query(`
      SELECT sub.id, sub.submitted_flag, sub.is_correct, sub.submitted_at,
             c.title AS challenge_title, c.id AS challenge_id
      FROM submissions sub
      JOIN challenges c ON c.id = sub.challenge_id
      WHERE sub.user_id = ?
      ORDER BY sub.submitted_at DESC LIMIT 50
    `, [req.user.id]);

    const [solvedChallenges] = await pool.query(`
      SELECT c.id, c.title, c.difficulty, c.points, cat.title AS category, s.solved_at
      FROM solves s
      JOIN challenges c ON c.id = s.challenge_id
      JOIN categories cat ON cat.id = c.category_id
      WHERE s.user_id = ?
      ORDER BY s.solved_at DESC
    `, [req.user.id]);

    res.json({ user: rows[0], submissions, solvedChallenges });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/avatars/${req.file.filename}`;
    await pool.query(
      'UPDATE users SET avatar_url = ?, avatar_type = ? WHERE id = ?',
      [url, 'upload', req.user.id]
    );
    res.json({ message: 'Avatar updated', avatar_url: url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

const setPresetAvatar = async (req, res) => {
  try {
    const { preset } = req.body;
    const valid = ['hacker1','hacker2','hacker3','hacker4','hacker5','hacker6','default'];
    if (!valid.includes(preset))
      return res.status(400).json({ error: 'Invalid preset' });
    await pool.query(
      'UPDATE users SET avatar_preset = ?, avatar_type = ?, avatar_url = NULL WHERE id = ?',
      [preset, 'preset', req.user.id]
    );
    res.json({ message: 'Avatar updated', avatar_preset: preset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set preset' });
  }
};

const removeAvatar = async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET avatar_url = NULL, avatar_type = ?, avatar_preset = ? WHERE id = ?',
      ['default', 'default', req.user.id]
    );
    res.json({ message: 'Avatar removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove avatar' });
  }
};

module.exports = { getProfile, uploadAvatar, setPresetAvatar, removeAvatar };
