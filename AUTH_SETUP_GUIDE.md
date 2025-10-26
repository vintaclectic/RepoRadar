# RepoRadar Authentication System - Setup Guide

## What's New

Your RepoRadar app now has a complete authentication system that saves your GitHub token permanently in a database! Users can create accounts, login, and their tokens will be saved forever.

## Features

- **User Registration & Login**: Create an account with username, email, and password
- **Persistent Token Storage**: GitHub tokens are saved in SQLite database
- **Session Management**: Stay logged in for 30 days
- **Automatic Token Loading**: Tokens are automatically loaded when you log in
- **Cross-Device Access**: Login from any device to access your saved token

## How to Run

### 1. Start the Backend Server

Open a terminal and run:

```bash
npm run server
```

You should see:
```
🚀 RepoRadar server running on http://localhost:3000
Connected to SQLite database
Users table ready
GitHub tokens table ready
Sessions table ready
```

### 2. Start the Frontend (in a new terminal)

```bash
npm start
```

This will open RepoRadar in your browser at `http://localhost:5500`

## How to Use

### First Time Setup

1. When you open RepoRadar, you'll see a login/signup modal
2. Click "Sign up" to create an account
3. Enter:
   - Username (3+ characters)
   - Email
   - Password (6+ characters)
4. Click "Sign Up"
5. You'll be automatically logged in!

### Adding Your GitHub Token

1. Once logged in, click the ⚙️ Settings button
2. Enter your GitHub Personal Access Token
3. Click "💾 Save Token"
4. Your token is now saved permanently in the database!

### Logging In (Next Time)

1. Open RepoRadar
2. Enter your username or email and password
3. Your GitHub token will be automatically loaded

### Logging Out

Click the "Logout" button in the top right corner

## Database

The SQLite database is created at: `server/reporadar.db`

It contains three tables:
- **users**: Store user accounts (username, email, hashed password)
- **github_tokens**: Store GitHub tokens for each user
- **sessions**: Manage user sessions (30-day expiration)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### GitHub Tokens
- `POST /api/token/save` - Save GitHub token (requires authentication)
- `GET /api/token/get` - Get GitHub token (requires authentication)
- `DELETE /api/token/delete` - Delete GitHub token (requires authentication)

## Security Features

- Passwords are hashed with bcrypt (10 rounds)
- Session tokens are 32-byte secure random strings
- Sessions expire after 30 days
- GitHub tokens are encrypted in database
- CORS enabled for frontend-backend communication

## Troubleshooting

### "Cannot connect to server"
Make sure the backend server is running with `npm run server`

### "Invalid credentials"
Check your username/email and password are correct

### "Token not saving"
Make sure you're logged in before saving the token

### Port already in use
- Backend uses port 3000
- Frontend uses port 5500
- Change ports in `server/server.js` and `package.json` if needed

## Development Mode

For auto-restart on code changes:

```bash
npm run server:dev
```

This uses nodemon to automatically restart the server when you edit server files.

## What Happens When You Save a Token

1. You enter your GitHub token in Settings
2. Frontend validates the token format
3. Frontend sends token to backend API (requires login)
4. Backend saves token to database for your user ID
5. Token is associated with your account forever
6. Next time you login, token is automatically loaded
7. Token syncs across all devices you login from

## Next Steps

- Your tokens are now saved permanently!
- Users can access their tokens from any device
- No more losing tokens when clearing browser data
- Each user has their own private token storage

Enjoy your new persistent authentication system! 🎉
