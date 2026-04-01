const { pool } = require('../config/db');
const ChallengeModel = require('../models/ChallengeModel');

const getAllChallenges = async (req, res) => {
  try {
    const challenges = await ChallengeModel.getAllChallenges(req.user.id, req.query);
    res.json({ challenges });
  } catch (err) {
    console.error('[Challenge] Get all:', err);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
};

const getChallenge = async (req, res) => {
  try {
    const challenge = await ChallengeModel.getChallengeById(req.user.id, req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    res.json({ challenge });
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

    const alreadySolved = await ChallengeModel.checkAlreadySolved(conn, req.user.id, id);
    if (alreadySolved) {
      await conn.rollback();
      return res.status(400).json({ error: 'Already solved!' });
    }

    const challenge = await ChallengeModel.getActiveChallengeById(conn, id);
    if (!challenge) {
      await conn.rollback();
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const isCorrect = flag.trim() === challenge.flag.trim();
    await ChallengeModel.insertSubmission(conn, req.user.id, id, flag.trim(), isCorrect);

    if (isCorrect) {
      await ChallengeModel.recordSolve(conn, req.user.id, id, challenge.points);
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
