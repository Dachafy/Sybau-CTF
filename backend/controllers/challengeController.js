const fs = require('fs');
const path = require('path');
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

const downloadAttachment = async (req, res) => {
  try {
    const challenge = await ChallengeModel.getChallengeAttachmentById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!challenge.attachment_url) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const uploadsRoot = path.resolve(__dirname, '../uploads');
    const relativeAssetPath = challenge.attachment_url
      .replace(/^\/+/, '')
      .replace(/^uploads\/?/, '');
    const filePath = path.resolve(uploadsRoot, relativeAssetPath);

    if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
      return res.status(400).json({ error: 'Invalid attachment path' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Attachment file is missing' });
    }

    res.set('Cache-Control', 'no-store');
    return res.download(filePath, challenge.attachment_name || path.basename(filePath));
  } catch (err) {
    console.error('[Challenge] Download attachment:', err);
    res.status(500).json({ error: 'Failed to download attachment' });
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

module.exports = { getAllChallenges, getChallenge, downloadAttachment, submitFlag };
