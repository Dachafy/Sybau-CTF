const express = require('express');
const router = express.Router();
const {
  getAllChallenges,
  getChallenge,
  downloadAttachment,
  submitFlag,
} = require('../controllers/challengeController');
const { authenticate } = require('../middleware/auth');
const { flagSubmitLimiter } = require('../middleware/rateLimiter');

router.get('/', authenticate, getAllChallenges);
router.get('/:id', authenticate, getChallenge);
router.get('/:id/download', authenticate, downloadAttachment);
router.post('/:id/submit', authenticate, flagSubmitLimiter, submitFlag);

module.exports = router;
