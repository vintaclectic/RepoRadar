// Authentication state
let currentUser = null;
let sessionToken = null;

// Auto-detect environment and set API URL
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE = isProduction
    ? 'https://vintaclectic-reporadar-backend.onrender.com/api'
    : 'http://localhost:3000/api';

// Load session on page load
async function loadSession() {
    console.log('🔍 Loading session...');
    sessionToken = localStorage.getItem('session_token');
    const userJson = localStorage.getItem('current_user');

    if (sessionToken && userJson) {
        try {
            currentUser = JSON.parse(userJson);
            console.log('✅ Session found for user:', currentUser.username);

            // Validate session with server
            const response = await fetch(`${API_BASE}/token/get`, {
                headers: { 'x-session-token': sessionToken }
            });

            if (response.ok) {
                console.log('✅ Session is valid');
                updateUIForLoggedInUser();
                await loadGitHubTokenFromServer();
            } else {
                console.log('❌ Session expired, please login again');
                // Clear invalid session
                localStorage.removeItem('session_token');
                localStorage.removeItem('current_user');
                sessionToken = null;
                currentUser = null;
                showAuthModal();
            }
        } catch (error) {
            console.error('Error loading session:', error);
            showAuthModal();
        }
    } else {
        console.log('ℹ️ No session found, showing login modal');
        showAuthModal();
    }
}

// Show authentication modal
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'flex';
}

// Hide authentication modal
function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

// Switch between login and signup
function switchToSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

function switchToLogin() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// Register user
async function register() {
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const statusDiv = document.getElementById('signupStatus');

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            statusDiv.className = 'auth-status error';
            statusDiv.textContent = data.error;
            return;
        }

        sessionToken = data.sessionToken;
        currentUser = data.user;
        localStorage.setItem('session_token', sessionToken);
        localStorage.setItem('current_user', JSON.stringify(currentUser));

        statusDiv.className = 'auth-status success';
        statusDiv.textContent = 'Account created successfully!';

        setTimeout(() => {
            hideAuthModal();
            updateUIForLoggedInUser();
        }, 1000);
    } catch (error) {
        statusDiv.className = 'auth-status error';
        statusDiv.textContent = 'Registration failed. Please try again.';
    }
}

// Login user
async function login() {
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    const statusDiv = document.getElementById('loginStatus');

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        const data = await response.json();

        if (!response.ok) {
            statusDiv.className = 'auth-status error';
            statusDiv.textContent = data.error;
            return;
        }

        sessionToken = data.sessionToken;
        currentUser = data.user;
        localStorage.setItem('session_token', sessionToken);
        localStorage.setItem('current_user', JSON.stringify(currentUser));

        statusDiv.className = 'auth-status success';
        statusDiv.textContent = 'Login successful!';

        setTimeout(() => {
            hideAuthModal();
            updateUIForLoggedInUser();
            loadGitHubTokenFromServer();
        }, 1000);
    } catch (error) {
        statusDiv.className = 'auth-status error';
        statusDiv.textContent = 'Login failed. Please try again.';
    }
}

// Logout
async function logout() {
    if (!sessionToken) return;

    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { 'x-session-token': sessionToken }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    sessionToken = null;
    currentUser = null;
    apiToken = null;
    localStorage.removeItem('session_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('github_api_token');

    location.reload();
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <span class="user-greeting">Hello, <strong>${currentUser.username}</strong>!</span>
            <button class="logout-btn" onclick="logout()">Logout</button>
        `;
        userInfo.style.display = 'flex';
    }
}

// Load GitHub token from server
async function loadGitHubTokenFromServer() {
    if (!sessionToken) return;

    try {
        const response = await fetch(`${API_BASE}/token/get`, {
            headers: { 'x-session-token': sessionToken }
        });

        const data = await response.json();
        if (data.token) {
            // Set the global apiToken variable
            window.apiToken = data.token;
            apiToken = data.token;
            // Also save to localStorage as backup
            localStorage.setItem('github_api_token', apiToken);
            console.log('✅ GitHub token loaded from server');

            // Update the token input if settings modal is open
            const tokenInput = document.getElementById('apiTokenInput');
            if (tokenInput) {
                tokenInput.value = apiToken;
            }

            // Update rate limit display
            if (typeof updateRateLimitDisplay === 'function') {
                await updateRateLimitDisplay();
            }
        }
    } catch (error) {
        console.error('Failed to load GitHub token:', error);
    }
}

// Save GitHub token to server
async function saveGitHubTokenToServer(token) {
    if (!sessionToken) {
        alert('Please login first');
        return false;
    }

    try {
        const response = await fetch(`${API_BASE}/token/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-session-token': sessionToken
            },
            body: JSON.stringify({ token })
        });

        const data = await response.json();
        return response.ok;
    } catch (error) {
        console.error('Failed to save GitHub token:', error);
        return false;
    }
}
