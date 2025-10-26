const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'reporadar.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database:', err);
    else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS github_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
    });
}

const userDB = {
    createUser: (username, email, password) => {
        return new Promise((resolve, reject) => {
            const passwordHash = bcrypt.hashSync(password, 10);
            db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, passwordHash],
                function(err) {
                    if (err) reject(err.message.includes('UNIQUE') ? new Error('Username or email already exists') : err);
                    else resolve({ id: this.lastID, username, email });
                });
        });
    },
    findUser: (identifier) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ? OR username = ?',
                [identifier, identifier], (err, row) => err ? reject(err) : resolve(row));
        });
    },
    verifyPassword: (password, hash) => bcrypt.compareSync(password, hash)
};

const tokenDB = {
    saveToken: (userId, token) => {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO github_tokens (user_id, token, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET token = excluded.token, updated_at = CURRENT_TIMESTAMP`,
                [userId, token], function(err) { err ? reject(err) : resolve({ userId }); });
        });
    },
    getToken: (userId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT token FROM github_tokens WHERE user_id = ?',
                [userId], (err, row) => err ? reject(err) : resolve(row));
        });
    },
    deleteToken: (userId) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM github_tokens WHERE user_id = ?',
                [userId], (err) => err ? reject(err) : resolve());
        });
    }
};

const sessionDB = {
    createSession: (userId, sessionToken, days = 30) => {
        return new Promise((resolve, reject) => {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + days);
            db.run('INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
                [userId, sessionToken, expiresAt.toISOString()],
                (err) => err ? reject(err) : resolve({ sessionToken, expiresAt }));
        });
    },
    validateSession: (sessionToken) => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT s.*, u.id as user_id, u.username, u.email FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_token = ? AND s.expires_at > datetime('now')`,
                [sessionToken], (err, row) => err ? reject(err) : resolve(row));
        });
    },
    deleteSession: (sessionToken) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM sessions WHERE session_token = ?',
                [sessionToken], (err) => err ? reject(err) : resolve());
        });
    }
};

module.exports = { db, userDB, tokenDB, sessionDB };
