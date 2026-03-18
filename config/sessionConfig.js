import db, { dbPool } from './db.js';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';

const MySQLStore = MySQLStoreFactory(session);
const isProduction = process.env.NODE_ENV === 'production';
export const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'sybau.sid';


// 3. Configure the Session Store
const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 mins
    expiration: 3600000,             // 1 hour
    createDatabaseTable: true
}, dbPool);

export function ensureSessionTableExists() {
    return db.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
            session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
            expires INT UNSIGNED NOT NULL,
            data MEDIUMTEXT COLLATE utf8mb4_bin,
            PRIMARY KEY (session_id),
            KEY session_expires_idx (expires)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
    `);
}

// 4. Export the configured middleware
export const sessionConfig = session({
    name: sessionCookieName,
    secret: process.env.SESSION_SECRET || 'change-this-session-secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    unset: 'destroy',
    cookie: {
        maxAge: 3600000,
        secure: isProduction ? true : 'auto',
        httpOnly: true,
        sameSite: 'lax'
    }
});
