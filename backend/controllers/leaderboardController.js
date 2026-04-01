const LeaderboardModel = require('../models/LeaderboardModel');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await LeaderboardModel.getTopUsers(100);
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

module.exports = { getLeaderboard };
