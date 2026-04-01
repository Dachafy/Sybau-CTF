const jwt = require('jsonwebtoken');
const AuthModel = require('../models/AuthModel');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    if (!username || !email || !password || !confirmPassword)
      return res.status(400).json({ error: 'All fields required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (password !== confirmPassword)
      return res.status(400).json({ error: 'Passwords do not match' });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
      return res.status(400).json({ error: 'Username: 3-20 chars, letters/numbers/underscore only' });

    const existing = await AuthModel.findExistingUser(username, email);
    if (existing) return res.status(409).json({ error: 'Username or email already exists' });

    const userId = await AuthModel.createUser(username, email, password);
    res.status(201).json({ message: 'Registration successful', userId });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ error: 'Username/email and password required' });

    const user = await AuthModel.findByUsernameOrEmail(identifier);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.is_banned) return res.status(403).json({ error: 'Account has been banned' });
    if (!user.password_hash) return res.status(401).json({ error: 'Please use OAuth to login' });

    const valid = await AuthModel.verifyPassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Store user info in session
    req.session.userId = user.id;
    req.session.role   = user.role;

    // FIX: Call session.save() before responding to guarantee the session
    //      is written to the MySQL store before the client makes the next
    //      request. Without this, a fast client can hit /api/auth/me before
    //      the async write completes and get a 401.
    req.session.save((err) => {
      if (err) {
        console.error('[Auth] Session save error:', err);
        return res.status(500).json({ error: 'Session error during login' });
      }
      const token = generateToken(user);
      const { password_hash, ...safeUser } = user;
      res.json({ token, user: safeUser });
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('sybau_sid');
    res.json({ message: 'Logged out successfully' });
  });
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, logout, getMe };