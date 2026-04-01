const { pool } = require('../config/db');

const getTopUsers = async (limit = 100) => {
  const [rows] = await pool.query(`
    SELECT u.id, u.username, u.avatar_type, u.avatar_url, u.avatar_preset,
           u.total_points, COUNT(DISTINCT s.id) AS solve_count,
           MAX(s.solved_at) AS last_solve_time
    FROM users u
    LEFT JOIN solves s ON s.user_id = u.id
    WHERE u.is_banned = 0 AND u.role = 'user'
    GROUP BY u.id
    ORDER BY u.total_points DESC, last_solve_time ASC
    LIMIT ?
  `, [limit]);
  return rows;
};

module.exports = { getTopUsers };
