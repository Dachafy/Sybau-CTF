const { pool } = require('../config/db');
const path = require('path');
const fs = require('fs');

const normalizeAssetPath = (url) => {
  if (!url) return null;
  if (url.startsWith('/')) return url;

  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
};

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
  if (!rows[0]) return null;

  return {
    ...rows[0],
    avatar_url: normalizeAssetPath(rows[0].avatar_url),
  };
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

const getAvatarInfo = async (userId) => {
  const [rows] = await pool.query(
    'SELECT avatar_url, avatar_type FROM users WHERE id = ?',
    [userId]
  );
  if (!rows[0]) return null;

  return {
    ...rows[0],
    avatar_url: normalizeAssetPath(rows[0].avatar_url),
  };
};

const deleteOldAvatarFile = async (userId) => {
  const info = await getAvatarInfo(userId);
  if (info?.avatar_type === 'upload' && info?.avatar_url) {
    const oldPath = path.join(__dirname, '..', info.avatar_url);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }
};

const setUploadedAvatar = async (userId, url) => {
  await deleteOldAvatarFile(userId);
  await pool.query(
    'UPDATE users SET avatar_url = ?, avatar_type = ?, avatar_preset = NULL WHERE id = ?',
    [url, 'upload', userId]
  );
};

const setPresetAvatar = async (userId, preset) => {
  await deleteOldAvatarFile(userId);
  await pool.query(
    'UPDATE users SET avatar_preset = ?, avatar_type = ?, avatar_url = NULL WHERE id = ?',
    [preset, 'preset', userId]
  );
};

const clearAvatar = async (userId) => {
  await deleteOldAvatarFile(userId);
  await pool.query(
    'UPDATE users SET avatar_url = NULL, avatar_type = ?, avatar_preset = ? WHERE id = ?',
    ['default', 'default', userId]
  );
};

const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, username, email, role, is_banned, avatar_url, avatar_preset, avatar_type, total_points FROM users WHERE id = ?',
    [id]
  );
  if (!rows[0]) return null;

  return {
    ...rows[0],
    avatar_url: normalizeAssetPath(rows[0].avatar_url),
  };
};

module.exports = {
  getUserProfile, getUserSubmissions, getUserSolvedChallenges,
  setUploadedAvatar, setPresetAvatar, clearAvatar, findById,
};
