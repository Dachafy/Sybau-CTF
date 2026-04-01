const express = require('express');
const router = express.Router();
const { getAllChallenges, getChallenge, submitFlag } = require('../controllers/challengeController');
const { authenticate } = require('../middleware/auth');
const { flagSubmitLimiter } = require('../middleware/rateLimiter');

router.get('/', authenticate, getAllChallenges);
router.get('/:id', authenticate, getChallenge);
router.post('/:id/submit', authenticate, flagSubmitLimiter, submitFlag);

module.exports = router;
