require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { testConnection } = require('./config/db');
const { initSchema } = require('./config/schema');

const app = express();

// Trust proxy — required when behind Tailscale/Nginx/any reverse proxy
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*', credentials: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
app.use('/uploads', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/users', require('./routes/users'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/admin', require('./routes/admin'));

// Public categories
app.get('/api/categories', async (req, res) => {
  try {
    const { pool } = require('./config/db');
    const [rows] = await pool.query('SELECT id, title, icon, color, description FROM categories ORDER BY title');
    res.json({ categories: rows });
  } catch (err) {
    console.error('[Categories]', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React production build
const buildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    }
  });
}

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large' });
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await testConnection();
  await initSchema();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Sybau-CTF API running on http://0.0.0.0:${PORT}`);
  });
};

start();