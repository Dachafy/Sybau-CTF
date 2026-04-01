const { pool } = require('../config/db');

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

// ─── Challenges ───────────────────────────────────────────────────────────────

const getAllChallenges = async (userId, { category, difficulty } = {}) => {
  let sql = `
    SELECT c.id, c.title, c.description, c.difficulty, c.points, c.solve_count,
           c.attachment_url, c.attachment_name, c.hint,
           cat.title AS category, cat.icon AS category_icon,
           cat.color AS category_color, cat.id AS category_id,
           IF(s.id IS NOT NULL, 1, 0) AS is_solved
    FROM challenges c
    JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN solves s ON s.challenge_id = c.id AND s.user_id = ?
    WHERE c.is_active = 1
  `;
  const params = [userId];
  if (category)   { sql += ' AND cat.id = ?';       params.push(category); }
  if (difficulty) { sql += ' AND c.difficulty = ?';  params.push(difficulty); }
  sql += ' ORDER BY cat.title, c.difficulty, c.points';
  const [rows] = await pool.query(sql, params);
  return rows.map(row => ({
    ...row,
    attachment_url: normalizeAssetPath(row.attachment_url),
  }));
};

const getChallengeById = async (userId, challengeId) => {
  const [rows] = await pool.query(`
    SELECT c.id, c.title, c.description, c.difficulty, c.points, c.solve_count,
           c.attachment_url, c.attachment_name, c.hint,
           cat.title AS category, cat.icon AS category_icon,
           cat.color AS category_color,
           IF(s.id IS NOT NULL, 1, 0) AS is_solved
    FROM challenges c
    JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN solves s ON s.challenge_id = c.id AND s.user_id = ?
    WHERE c.id = ? AND c.is_active = 1
  `, [userId, challengeId]);
  if (!rows[0]) return null;

  return {
    ...rows[0],
    attachment_url: normalizeAssetPath(rows[0].attachment_url),
  };
};

// ─── Submissions ──────────────────────────────────────────────────────────────

const checkAlreadySolved = async (conn, userId, challengeId) => {
  const [rows] = await conn.query(
    'SELECT id FROM solves WHERE user_id = ? AND challenge_id = ?',
    [userId, challengeId]
  );
  return rows.length > 0;
};

const getActiveChallengeById = async (conn, challengeId) => {
  const [rows] = await conn.query(
    'SELECT id, flag, points FROM challenges WHERE id = ? AND is_active = 1',
    [challengeId]
  );
  return rows[0] || null;
};

const insertSubmission = async (conn, userId, challengeId, flag, isCorrect) => {
  await conn.query(
    'INSERT INTO submissions (user_id, challenge_id, submitted_flag, is_correct) VALUES (?,?,?,?)',
    [userId, challengeId, flag, isCorrect ? 1 : 0]
  );
};

const recordSolve = async (conn, userId, challengeId, points) => {
  await conn.query(
    'INSERT INTO solves (user_id, challenge_id, points_awarded) VALUES (?,?,?)',
    [userId, challengeId, points]
  );
  await conn.query(
    'UPDATE users SET total_points = total_points + ? WHERE id = ?',
    [points, userId]
  );
  await conn.query(
    'UPDATE challenges SET solve_count = solve_count + 1 WHERE id = ?',
    [challengeId]
  );
};

module.exports = {
  getAllChallenges, getChallengeById,
  checkAlreadySolved, getActiveChallengeById, insertSubmission, recordSolve,
};
