const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getLeaderboard);

module.exports = router;
