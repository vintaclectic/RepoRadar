const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { userDB, tokenDB, sessionDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration for production
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://vintaclectic.github.io',
            'https://reporadar.vercel.app',
            'https://reporadar.onrender.com',
            'https://reporadar-api.onrender.com',
            'http://localhost:5500',
            'http://127.0.0.1:5500'
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin starts with allowed GitHub Pages domain
        if (origin.startsWith('https://vintaclectic.github.io')) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('src'));

// Version/health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '2.0.0-session-fix',
        timestamp: new Date().toISOString(),
        sessionFormat: 'unix-timestamp'
    });
});

// Debug endpoint to check user data (authenticated)
app.get('/api/debug/me', authenticate, async (req, res) => {
    try {
        const tokenData = await tokenDB.getToken(req.user.id);
        const { db } = require('./database');

        db.get('SELECT COUNT(*) as count FROM sessions WHERE user_id = ?', [req.user.id], (err, sessionCount) => {
            if (err) {
                return res.status(500).json({ error: 'Database query failed' });
            }

            res.json({
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    email: req.user.email
                },
                token: {
                    exists: !!tokenData,
                    tokenPreview: tokenData ? tokenData.token.substring(0, 10) + '...' : null
                },
                sessions: {
                    activeCount: sessionCount.count
                }
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

async function authenticate(req, res, next) {
    const sessionToken = req.headers['x-session-token'];
    if (!sessionToken) {
        console.log('❌ Auth failed: No session token provided');
        return res.status(401).json({ error: 'No session token provided' });
    }

    try {
        const session = await sessionDB.validateSession(sessionToken);
        if (!session) {
            console.log('❌ Auth failed: Invalid or expired session for token:', sessionToken.substring(0, 10) + '...');
            return res.status(401).json({ error: 'Invalid or expired session' });
        }
        console.log('✅ Auth success: User', session.username, 'authenticated');
        req.user = { id: session.user_id, username: session.username, email: session.email };
        next();
    } catch (error) {
        console.error('❌ Auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log('📝 Registration attempt:', username, email);

        if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
        if (username.length < 3) return res.status(400).json({ error: 'Username must be 3+ characters' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ characters' });

        const user = await userDB.createUser(username, email, password);
        const sessionToken = generateSessionToken();
        await sessionDB.createSession(user.id, sessionToken);

        console.log('✅ User registered successfully:', username, 'Session token:', sessionToken.substring(0, 10) + '...');

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, username: user.username, email: user.email },
            sessionToken
        });
    } catch (error) {
        console.error('❌ Registration error:', error.message);
        res.status(error.message.includes('already exists') ? 409 : 500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        console.log('🔐 Login attempt:', identifier);

        if (!identifier || !password) {
            console.log('❌ Login failed: Missing credentials');
            return res.status(400).json({ error: 'Credentials required' });
        }

        const user = await userDB.findUser(identifier);
        if (!user) {
            console.log('❌ Login failed: User not found:', identifier);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordValid = userDB.verifyPassword(password, user.password_hash);
        console.log('🔑 Password validation:', passwordValid ? 'SUCCESS' : 'FAILED');

        if (!passwordValid) {
            console.log('❌ Login failed: Invalid password for user:', user.username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const sessionToken = generateSessionToken();
        await sessionDB.createSession(user.id, sessionToken);

        console.log('✅ Login successful:', user.username, 'Session token:', sessionToken.substring(0, 10) + '...');

        res.json({
            message: 'Login successful',
            user: { id: user.id, username: user.username, email: user.email },
            sessionToken
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/logout', authenticate, async (req, res) => {
    try {
        await sessionDB.deleteSession(req.headers['x-session-token']);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Token routes
app.post('/api/token/save', authenticate, async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token required' });
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            return res.status(400).json({ error: 'Invalid token format' });
        }
        
        await tokenDB.saveToken(req.user.id, token);
        res.json({ message: 'Token saved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save token' });
    }
});

app.get('/api/token/get', authenticate, async (req, res) => {
    try {
        const tokenData = await tokenDB.getToken(req.user.id);
        res.json({ token: tokenData ? tokenData.token : null });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve token' });
    }
});

app.delete('/api/token/delete', authenticate, async (req, res) => {
    try {
        await tokenDB.deleteToken(req.user.id);
        res.json({ message: 'Token deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete token' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 RepoRadar server running on http://localhost:${PORT}`);
});
