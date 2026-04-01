const { pool } = require('./db');

const initSchema = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`sybau_ctf\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`sybau_ctf\``);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL UNIQUE,
        icon VARCHAR(10) DEFAULT '🗂',
        color VARCHAR(20) DEFAULT '#00ffcc',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) DEFAULT NULL,
        role ENUM('user','admin') DEFAULT 'user',
        avatar_type ENUM('upload','preset','default') DEFAULT 'default',
        avatar_url VARCHAR(500) DEFAULT NULL,
        avatar_preset VARCHAR(100) DEFAULT 'default',
        total_points INT DEFAULT 0,
        is_banned TINYINT(1) DEFAULT 0,
        oauth_provider VARCHAR(20) DEFAULT NULL,
        oauth_id VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category_id INT NOT NULL,
        difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'easy',
        points INT NOT NULL DEFAULT 100,
        flag VARCHAR(500) NOT NULL,
        hint TEXT DEFAULT NULL,
        attachment_url VARCHAR(500) DEFAULT NULL,
        attachment_name VARCHAR(255) DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        solve_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        challenge_id INT NOT NULL,
        submitted_flag VARCHAR(500) NOT NULL,
        is_correct TINYINT(1) DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS solves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        challenge_id INT NOT NULL,
        points_awarded INT NOT NULL,
        solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_solve (user_id, challenge_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      INSERT IGNORE INTO categories (title, icon, color, description) VALUES
      ('OSINT', '🔍', '#00ffcc', 'Open Source Intelligence'),
      ('Cryptography', '🔐', '#ffdd00', 'Ciphers, encoding, encryption'),
      ('Web Exploitation', '🌐', '#ff00cc', 'Web app vulnerabilities')
    `);

    console.log('[DB] Schema initialized');
  } catch (err) {
    console.error('[DB] Schema init error:', err.message);
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { initSchema };

