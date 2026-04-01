require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const MySQLStore = MySQLStoreFactory(session);
const { testConnection, pool } = require('./config/db');
const { initSchema } = require('./config/schema');

const app = express();

// FIX: Only trust proxy in production. In dev this causes session cookie issues.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Required for session cookies cross-origin
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Session Store (MySQL) ────────────────────────────────────────────────────
// FIX: Pass existing pool as 2nd arg — avoids duplicate DB connection
//      which was the root cause of session store silently failing.
const sessionStore = new MySQLStore(
  {
    clearExpired:            true,
    checkExpirationInterval: 900000,               // prune every 15 min
    expiration:              7 * 24 * 60 * 60 * 1000, // 7 days
    createDatabaseTable:     true,                 // auto-create sessions table
    schema: {
      tableName: 'sessions',
      columnNames: {
        session_id: 'session_id',
        expires:    'expires',
        data:       'data',
      },
    },
  },
  pool // ← KEY FIX: reuse existing pool, don't pass raw credentials
);

sessionStore.on('error', (err) => {
  console.error('[Session Store] Error:', err.message);
});

app.use(session({
  key:    'sybau_sid',
  secret: process.env.SESSION_SECRET || 'fallback_secret_change_me',
  store:  sessionStore,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // FIX: secure must be false in dev (HTTP). true only with HTTPS in prod.
    secure:   process.env.NODE_ENV === 'production',
    // FIX: sameSite 'none' requires secure:true (HTTPS). Use 'lax' for dev.
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  },
}));

// ─── Static Uploads ───────────────────────────────────────────────────────────
app.use('/uploads', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/challenges',  require('./routes/challenges'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/admin',       require('./routes/admin'));

// ─── Public Categories ────────────────────────────────────────────────────────
// FIX: use top-level pool directly instead of require() inside handler
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, icon, color, description FROM categories ORDER BY title'
    );
    res.json({ categories: rows });
  } catch (err) {
    console.error('[Categories]', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── Serve React Production Build ─────────────────────────────────────────────
// FIX: corrected build path — frontend folder is 'frontend', not at root level
const buildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      }
    },
  }));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.set('Cache-Control', 'no-store');
      res.sendFile(path.join(buildPath, 'index.html'));
    }
  });
}

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ error: 'File too large' });
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await testConnection();
  await initSchema();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Sybau-CTF API running on http://0.0.0.0:${PORT}`);
    console.log(`[Session] Store: MySQL | Env: ${process.env.NODE_ENV || 'development'} | Cookie secure: ${process.env.NODE_ENV === 'production'}`);
  });
};

start();