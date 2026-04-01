const { pool } = require('../config/db');

// ─── Profile ──────────────────────────────────────────────────────────────────

const getUserProfile = async (userId) => {
  const [rows] = await pool.query(`
    SELECT u.id, u.username, u.email, u.role, u.avatar_type, u.avatar_url,
           u.avatar_preset, u.total_points, u.created_at,
           COUNT(DISTINCT s.id) AS solve_count
    FROM users u
    LEFT JOIN solves s ON s.user_id = u.id
    WHERE u.id = ?
    GROUP BY u.id
  `, [userId]);
  return rows[0] || null;
};

const getUserSubmissions = async (userId) => {
  const [rows] = await pool.query(`
    SELECT sub.id, sub.submitted_flag, sub.is_correct, sub.submitted_at,
           c.title AS challenge_title, c.id AS challenge_id
    FROM submissions sub
    JOIN challenges c ON c.id = sub.challenge_id
    WHERE sub.user_id = ?
    ORDER BY sub.submitted_at DESC LIMIT 50
  `, [userId]);
  return rows;
};

const getUserSolvedChallenges = async (userId) => {
  const [rows] = await pool.query(`
    SELECT c.id, c.title, c.difficulty, c.points, cat.title AS category, s.solved_at
    FROM solves s
    JOIN challenges c ON c.id = s.challenge_id
    JOIN categories cat ON cat.id = c.category_id
    WHERE s.user_id = ?
    ORDER BY s.solved_at DESC
  `, [userId]);
  return rows;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

// const setUploadedAvatar = async (userId, url) => {
//   await pool.query(
//     'UPDATE users SET avatar_url = ?, avatar_type = ? WHERE id = ?',
//     [url, 'upload', userId]
//   );
// };

const setPresetAvatar = async (userId, preset) => {
  await pool.query(
    'UPDATE users SET avatar_preset = ?, avatar_type = ?, avatar_url = NULL WHERE id = ?',
    [preset, 'preset', userId]
  );
};

const clearAvatar = async (userId) => {
  await pool.query(
    'UPDATE users SET avatar_url = NULL, avatar_type = ?, avatar_preset = ? WHERE id = ?',
    ['default', 'default', userId]
  );
};

module.exports = {
  getUserProfile, getUserSubmissions, getUserSolvedChallenges,
  setPresetAvatar, clearAvatar,
};
