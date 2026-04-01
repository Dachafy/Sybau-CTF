const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

const authenticate = async (req, res, next) => {
  try {
    let userId = null;

    // 1. Check session first (stored in DB)
    if (req.session?.userId) {
      userId = req.session.userId;
    } else {
      // 2. Fallback to JWT Bearer token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      }
    }

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.is_banned) return res.status(403).json({ error: 'Account banned' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = { authenticate, requireAdmin };