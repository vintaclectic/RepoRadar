const bcrypt = require('bcryptjs');
const path = require('path');

// Detect database type from environment
const DATABASE_URL = process.env.DATABASE_URL;
const usePostgres = !!DATABASE_URL;

console.log(`🗄️  Database mode: ${usePostgres ? 'PostgreSQL' : 'SQLite'}`);

let db;

if (usePostgres) {
    // PostgreSQL setup
    const { Pool } = require('pg');
    db = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test connection
    db.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error('❌ PostgreSQL connection error:', err);
        } else {
            console.log('✅ Connected to PostgreSQL database');
            initializePostgres();
        }
    });
} else {
    // SQLite setup
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'reporadar.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ SQLite connection error:', err);
        } else {
            console.log('✅ Connected to SQLite database');
            initializeSQLite().then(() => {
                sessionDB.cleanupInvalidSessions().catch(err => console.error('Session cleanup error:', err));
                sessionDB.cleanupExpiredSessions().catch(err => console.error('Session cleanup error:', err));
            }).catch(err => console.error('SQLite init error:', err));
        }
    });
}

function initializePostgres() {
    const queries = [
        `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS github_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id)
        )`,
        `CREATE TABLE IF NOT EXISTS sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            session_token TEXT UNIQUE NOT NULL,
            expires_at BIGINT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`
    ];

    Promise.all(queries.map(query =>
        new Promise((resolve, reject) => {
            db.query(query, (err) => {
                if (err) {
                    console.error('PostgreSQL table creation error:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        })
    )).then(() => {
        sessionDB.cleanupInvalidSessions().catch(err => console.error('Session cleanup error:', err));
        sessionDB.cleanupExpiredSessions().catch(err => console.error('Session cleanup error:', err));
    }).catch(err => console.error('PostgreSQL init error:', err));
}

function initializeSQLite() {
    return new Promise((resolve, reject) => {
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
                expires_at BIGINT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

// Unified database interface
const userDB = {
    createUser: (username, email, password) => {
        return new Promise((resolve, reject) => {
            const passwordHash = bcrypt.hashSync(password, 10);

            if (usePostgres) {
                db.query(
                    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
                    [username, email, passwordHash],
                    (err, result) => {
                        if (err) {
                            reject(err.message.includes('duplicate') || err.message.includes('unique')
                                ? new Error('Username or email already exists')
                                : err);
                        } else {
                            resolve(result.rows[0]);
                        }
                    }
                );
            } else {
                db.run(
                    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                    [username, email, passwordHash],
                    function(err) {
                        if (err) {
                            reject(err.message.includes('UNIQUE')
                                ? new Error('Username or email already exists')
                                : err);
                        } else {
                            resolve({ id: this.lastID, username, email });
                        }
                    }
                );
            }
        });
    },

    findUser: (identifier) => {
        return new Promise((resolve, reject) => {
            if (usePostgres) {
                db.query(
                    'SELECT * FROM users WHERE email = $1 OR username = $1',
                    [identifier],
                    (err, result) => err ? reject(err) : resolve(result.rows[0])
                );
            } else {
                db.get(
                    'SELECT * FROM users WHERE email = ? OR username = ?',
                    [identifier, identifier],
                    (err, row) => err ? reject(err) : resolve(row)
                );
            }
        });
    },

    verifyPassword: (password, hash) => bcrypt.compareSync(password, hash)
};

const tokenDB = {
    saveToken: (userId, token) => {
        return new Promise((resolve, reject) => {
            if (usePostgres) {
                db.query(
                    `INSERT INTO github_tokens (user_id, token, updated_at)
                     VALUES ($1, $2, CURRENT_TIMESTAMP)
                     ON CONFLICT(user_id) DO UPDATE SET token = $2, updated_at = CURRENT_TIMESTAMP`,
                    [userId, token],
                    (err) => err ? reject(err) : resolve({ userId })
                );
            } else {
                db.run(
                    `INSERT INTO github_tokens (user_id, token, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
                     ON CONFLICT(user_id) DO UPDATE SET token = excluded.token, updated_at = CURRENT_TIMESTAMP`,
                    [userId, token],
                    function(err) { err ? reject(err) : resolve({ userId }); }
                );
            }
        });
    },

    getToken: (userId) => {
        return new Promise((resolve, reject) => {
            if (usePostgres) {
                db.query(
                    'SELECT token FROM github_tokens WHERE user_id = $1',
                    [userId],
                    (err, result) => err ? reject(err) : resolve(result.rows[0])
                );
            } else {
                db.get(
                    'SELECT token FROM github_tokens WHERE user_id = ?',
                    [userId],
                    (err, row) => err ? reject(err) : resolve(row)
                );
            }
        });
    },

    deleteToken: (userId) => {
        return new Promise((resolve, reject) => {
            if (usePostgres) {
                db.query(
                    'DELETE FROM github_tokens WHERE user_id = $1',
                    [userId],
                    (err) => err ? reject(err) : resolve()
                );
            } else {
                db.run(
                    'DELETE FROM github_tokens WHERE user_id = ?',
                    [userId],
                    (err) => err ? reject(err) : resolve()
                );
            }
        });
    }
};

const sessionDB = {
    createSession: (userId, sessionToken, days = 30) => {
        return new Promise((resolve, reject) => {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + days);
            const expiresAtUnix = Math.floor(expiresAt.getTime() / 1000);

            if (usePostgres) {
                db.query(
                    'INSERT INTO sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)',
                    [userId, sessionToken, expiresAtUnix],
                    (err) => err ? reject(err) : resolve({ sessionToken, expiresAt })
                );
            } else {
                db.run(
                    'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
                    [userId, sessionToken, expiresAtUnix],
                    (err) => err ? reject(err) : resolve({ sessionToken, expiresAt })
                );
            }
        });
    },

    validateSession: (sessionToken) => {
        return new Promise((resolve, reject) => {
            const nowUnix = Math.floor(Date.now() / 1000);

            if (usePostgres) {
                db.query(
                    `SELECT s.*, u.id as user_id, u.username, u.email
                     FROM sessions s
                     JOIN users u ON s.user_id = u.id
                     WHERE s.session_token = $1 AND s.expires_at > $2`,
                    [sessionToken, nowUnix],
                    (err, result) => err ? reject(err) : resolve(result.rows[0])
                );
            } else {
                db.get(
                    `SELECT s.*, u.id as user_id, u.username, u.email
                     FROM sessions s
                     JOIN users u ON s.user_id = u.id
                     WHERE s.session_token = ? AND s.expires_at > ?`,
                    [sessionToken, nowUnix],
                    (err, row) => err ? reject(err) : resolve(row)
                );
            }
        });
    },

    deleteSession: (sessionToken) => {
        return new Promise((resolve, reject) => {
            if (usePostgres) {
                db.query(
                    'DELETE FROM sessions WHERE session_token = $1',
                    [sessionToken],
                    (err) => err ? reject(err) : resolve()
                );
            } else {
                db.run(
                    'DELETE FROM sessions WHERE session_token = ?',
                    [sessionToken],
                    (err) => err ? reject(err) : resolve()
                );
            }
        });
    },

    cleanupExpiredSessions: () => {
        return new Promise((resolve, reject) => {
            const nowUnix = Math.floor(Date.now() / 1000);

            if (usePostgres) {
                db.query(
                    'DELETE FROM sessions WHERE expires_at < $1 OR expires_at IS NULL',
                    [nowUnix],
                    (err, result) => {
                        if (err) reject(err);
                        else {
                            console.log(`Cleaned up ${result.rowCount} expired sessions`);
                            resolve(result.rowCount);
                        }
                    }
                );
            } else {
                db.run(
                    'DELETE FROM sessions WHERE expires_at < ? OR expires_at IS NULL',
                    [nowUnix],
                    function(err) {
                        if (err) reject(err);
                        else {
                            console.log(`Cleaned up ${this.changes} expired sessions`);
                            resolve(this.changes);
                        }
                    }
                );
            }
        });
    },

    cleanupInvalidSessions: () => {
        return new Promise((resolve, reject) => {
            if (usePostgres) {
                // PostgreSQL doesn't need this - bigint is strictly typed
                resolve(0);
            } else {
                db.run(
                    "DELETE FROM sessions WHERE typeof(expires_at) != 'integer'",
                    [],
                    function(err) {
                        if (err) reject(err);
                        else {
                            console.log(`Cleaned up ${this.changes} invalid format sessions`);
                            resolve(this.changes);
                        }
                    }
                );
            }
        });
    }
};

// Note: cleanup runs after table initialization (see SQLite/Postgres init callbacks above)

module.exports = { db, userDB, tokenDB, sessionDB };
