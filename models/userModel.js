import db from '../config/db.js';

class User {
    static fetchAll() {
        return db.execute('SELECT * FROM users');
    }
    static save(username,email,password) {
        return db.execute('INSERT INTO users (username,email,password) VALUES (?,?,?)', [username,email,password]);
    }
}
export default User;