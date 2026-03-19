import db from '../config/db.js';

class User {
    static createTable() {
        return db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                gender VARCHAR(50) NOT NULL,
                province VARCHAR(100) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY users_email_unique (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    }

    static fetchAll() {
        return db.execute(`
            SELECT id, first_name, last_name, email, gender, province, created_at
            FROM users
            ORDER BY created_at DESC, id DESC
        `);
    }

    static save(first_name, last_name, email, password, gender, province) {
        return db.execute(
            'INSERT INTO users (first_name, last_name, email, password, gender, province) VALUES (?, ?, ?, ?, ?, ?)',
            [first_name, last_name, email, password, gender, province]
        );
    }

    static findById(id) {
        return db.execute(
            'SELECT id, first_name, last_name, email, gender, province, created_at FROM users WHERE id = ? LIMIT 1',
            [id]
        );
    }

    static findByEmail(email) {
        return db.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    }

    static findUser(searchTerm) {
        const keyword = `%${searchTerm}%`;

        return db.execute(
            `
                SELECT id, first_name, last_name, email, gender, province, created_at
                FROM users
                WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
                ORDER BY created_at DESC, id DESC
            `,
            [keyword, keyword, keyword]
        );
    }
}

export default User;
