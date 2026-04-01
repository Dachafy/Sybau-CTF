const { pool } = require('../config/db');

const getAllChallenges = async (req, res) => {
  try {
    const { category, difficulty } = req.query;
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
    const params = [req.user.id];
    if (category) { sql += ' AND cat.id = ?'; params.push(category); }
    if (difficulty) { sql += ' AND c.difficulty = ?'; params.push(difficulty); }
    sql += ' ORDER BY cat.title, c.difficulty, c.points';

    const [rows] = await pool.query(sql, params);
    res.json({ challenges: rows });
  } catch (err) {
    console.error('[Challenge] Get all:', err);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
};

const getChallenge = async (req, res) => {
  try {
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
    `, [req.user.id, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Challenge not found' });
    res.json({ challenge: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
};

const submitFlag = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { flag } = req.body;
    if (!flag) return res.status(400).json({ error: 'Flag required' });

    await conn.beginTransaction();

    const [solveCheck] = await conn.query(
      'SELECT id FROM solves WHERE user_id = ? AND challenge_id = ?',
      [req.user.id, id]
    );
    if (solveCheck.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'Already solved!' });
    }

    const [chRows] = await conn.query(
      'SELECT id, flag, points FROM challenges WHERE id = ? AND is_active = 1',
      [id]
    );
    if (!chRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = chRows[0];
    const isCorrect = flag.trim() === challenge.flag.trim();

    await conn.query(
      'INSERT INTO submissions (user_id, challenge_id, submitted_flag, is_correct) VALUES (?,?,?,?)',
      [req.user.id, id, flag.trim(), isCorrect ? 1 : 0]
    );

    if (isCorrect) {
      await conn.query(
        'INSERT INTO solves (user_id, challenge_id, points_awarded) VALUES (?,?,?)',
        [req.user.id, id, challenge.points]
      );
      await conn.query(
        'UPDATE users SET total_points = total_points + ? WHERE id = ?',
        [challenge.points, req.user.id]
      );
      await conn.query(
        'UPDATE challenges SET solve_count = solve_count + 1 WHERE id = ?',
        [id]
      );
      await conn.commit();
      return res.json({ correct: true, message: `Correct! +${challenge.points} pts`, points: challenge.points });
    }

    await conn.commit();
    return res.json({ correct: false, message: 'Wrong flag. Keep trying!' });
  } catch (err) {
    await conn.rollback();
    console.error('[Flag] Submit error:', err);
    res.status(500).json({ error: 'Submission error' });
  } finally {
    conn.release();
  }
};

module.exports = { getAllChallenges, getChallenge, submitFlag };
