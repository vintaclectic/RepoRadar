let currentFilter = null;
let searchResults = [];
let apiToken = null;
let rateLimitData = null;
let currentPage = 1;
let resultsPerPage = 25;
let allResults = [];
let repoDataCache = {}; // Cache for storing repo data for score breakdown
let userProfileCache = {}; // Cache for user profile data
let profilePopupTimeout = null;
let selectedLanguages = []; // Store selected languages for filtering
let availableLanguages = []; // Store all available languages from search results

// Format repository title - clean up dashes, underscores and format nicely
function formatRepoTitle(name) {
    if (!name) return '';

    // Replace dashes and underscores with spaces
    let formatted = name.replace(/[-_]/g, ' ');

    // Remove common prefixes/suffixes
    formatted = formatted.replace(/\b(js|ts|py|go|rs|cpp|java|php)\b$/i, '');

    // Remove extra spaces
    formatted = formatted.replace(/\s+/g, ' ').trim();

    // Capitalize first letter of each word
    formatted = formatted.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return formatted;
}

// Format description with markdown-like parsing
function formatDescription(text) {
    if (!text) return 'No description available';

    // Escape HTML to prevent XSS
    text = text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // Parse inline code: `code`
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Parse bold: **text** or __text__
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Parse italic: *text* or _text_ (but not already in bold)
    text = text.replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, '<em>$1</em>');
    text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

    // Parse links: [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" onclick="event.stopPropagation()" class="desc-link">$1</a>');

    // Convert line breaks
    text = text.replace(/\n/g, '<br>');

    return text;
}

// Pagination functions
function changeResultsPerPage() {
    const select = document.getElementById('perPageSelect');
    resultsPerPage = parseInt(select.value);
    currentPage = 1;
    displayResults(allResults);
}

function goToPage(page) {
    currentPage = page;
    displayResults(allResults);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPagination() {
    const paginationDiv = document.getElementById('paginationDiv');

    if (!allResults || allResults.length === 0) {
        paginationDiv.style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(allResults.length / resultsPerPage);

    if (totalPages <= 1) {
        paginationDiv.style.display = 'none';
        return;
    }

    paginationDiv.style.display = 'flex';

    let paginationHTML = '<div class="pagination-controls">';

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="goToPage(${currentPage - 1})">← Previous</button>`;
    }

    // Page numbers
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page + ellipsis
    if (startPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHTML += `<button class="page-btn ${activeClass}" onclick="goToPage(${i})">${i}</button>`;
    }

    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="page-btn" onclick="goToPage(${currentPage + 1})">Next →</button>`;
    }

    paginationHTML += '</div>';

    // Add results info
    const startResult = (currentPage - 1) * resultsPerPage + 1;
    const endResult = Math.min(currentPage * resultsPerPage, allResults.length);
    paginationHTML += `<div class="pagination-info">Showing ${startResult}-${endResult} of ${allResults.length} results</div>`;

    paginationDiv.innerHTML = paginationHTML;
}

// Settings functions
function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal.style.display === 'none' || !modal.style.display) {
        modal.style.display = 'flex';
        loadTokenToInput();
    } else {
        modal.style.display = 'none';
    }
}

function loadTokenToInput() {
    const input = document.getElementById('apiTokenInput');
    if (apiToken) {
        input.value = apiToken;
    }
}

async function saveApiToken() {
    const input = document.getElementById('apiTokenInput');
    const token = input.value.trim();
    const statusDiv = document.getElementById('tokenStatus');

    if (!token) {
        statusDiv.className = 'token-status error';
        statusDiv.textContent = '❌ Please enter a valid token';
        return;
    }

    // Basic validation - GitHub tokens start with ghp_ or github_pat_
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        statusDiv.className = 'token-status error';
        statusDiv.textContent = '❌ Token should start with "ghp_" (classic) or "github_pat_" (fine-grained)';
        return;
    }

    // Save to localStorage
    localStorage.setItem('github_api_token', token);
    apiToken = token;

    // Save to server if logged in
    if (typeof saveGitHubTokenToServer === 'function' && sessionToken) {
        const saved = await saveGitHubTokenToServer(token);
        if (saved) {
            console.log('Token saved to server successfully');
        }
    }

    statusDiv.className = 'token-status info';
    statusDiv.textContent = '⏳ Validating token...';

    // Validate token by checking rate limit
    try {
        const response = await fetch('https://api.github.com/rate_limit', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error('Invalid token');
        }

        const data = await response.json();
        const coreLimit = data.resources.core.limit;

        if (coreLimit === 60) {
            statusDiv.className = 'token-status error';
            statusDiv.innerHTML = `❌ Token is not working! Still getting unauthenticated limits (60/hour).<br><small>Make sure the token is valid and not expired.</small>`;
        } else {
            statusDiv.className = 'token-status success';
            statusDiv.innerHTML = `✅ Token validated and saved permanently! You now have ${coreLimit.toLocaleString()} requests/hour.<br><small style="color: #666;">⚠️ Classic token scopes needed: <strong>public_repo</strong> (starring), <strong>notifications</strong> (watching), <strong>user:follow</strong> (following users).</small>`;
        }

        // Update rate limit info
        await updateRateLimitDisplay();
    } catch (error) {
        console.error('Token validation error:', error);
        statusDiv.className = 'token-status error';
        statusDiv.innerHTML = `❌ Token validation failed: ${error.message}<br><small>The token might be invalid, expired, or revoked.</small>`;
    }
}

function clearApiToken() {
    const input = document.getElementById('apiTokenInput');
    const statusDiv = document.getElementById('tokenStatus');

    localStorage.removeItem('github_api_token');
    apiToken = null;
    input.value = '';

    statusDiv.className = 'token-status info';
    statusDiv.textContent = 'ℹ️ Token cleared. You now have 60 requests/hour (unauthenticated).';

    // Update rate limit info
    updateRateLimitDisplay();
}

function loadApiToken() {
    // Don't load from localStorage if we're loading from server
    // The server load happens in auth.js loadGitHubTokenFromServer()
    // This prevents overriding the server token
    if (typeof sessionToken !== 'undefined' && sessionToken) {
        // Skip localStorage load if user is logged in - token will come from server
        return;
    }
    const stored = localStorage.getItem('github_api_token');
    if (stored) {
        apiToken = stored;
    }
}

async function updateRateLimitDisplay() {
    const rateLimitDiv = document.getElementById('rateLimitInfo');

    if (!apiToken) {
        rateLimitDiv.innerHTML = '<p>Add a token to check your rate limit</p>';
        return;
    }

    // Fetch actual core API rate limit, not search API limit
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        if (apiToken) {
            headers['Authorization'] = `token ${apiToken}`;
        }

        const response = await fetch('https://api.github.com/rate_limit', { headers });
        const data = await response.json();

        // Use core API limits, not search API limits
        const coreLimit = data.resources.core;
        const { limit, remaining, reset } = coreLimit;

        const resetDate = new Date(reset * 1000);
        const resetTime = resetDate.toLocaleTimeString();

        const percentage = (remaining / limit) * 100;
        let statusEmoji = '🟢';
        if (percentage < 20) statusEmoji = '🔴';
        else if (percentage < 50) statusEmoji = '🟡';

        rateLimitDiv.innerHTML = `
            <p><strong>${statusEmoji} Status:</strong> ${apiToken ? 'Authenticated' : 'Unauthenticated'}</p>
            <p><strong>📊 Core API Limit:</strong> ${limit} requests/hour</p>
            <p><strong>✅ Remaining:</strong> ${remaining} requests</p>
            <p><strong>🔄 Resets at:</strong> ${resetTime}</p>
            <p style="font-size: 0.85em; color: #666; margin-top: 10px;">Search API: ${data.resources.search.remaining}/${data.resources.search.limit}</p>
        `;
    } catch (error) {
        console.error('Error fetching rate limit:', error);
        rateLimitDiv.innerHTML = '<p>Error fetching rate limit information</p>';
    }
}

function toggleFilter(filter) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    if (currentFilter === filter) {
        currentFilter = null;
    } else {
        currentFilter = filter;
        event.target.classList.add('active');
    }

    if (searchResults.length > 0) {
        displayResults(searchResults);
    }
}

// Language filter functions
function toggleLanguageFilter(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('languageDropdown');
    dropdown.classList.toggle('show');
}

function populateLanguages(repos) {
    // Extract unique languages from repositories
    const languages = new Set();
    repos.forEach(repo => {
        if (repo.language) {
            languages.add(repo.language);
        }
    });

    availableLanguages = Array.from(languages).sort();

    // Update the dropdown
    const languageList = document.getElementById('languageList');
    if (availableLanguages.length === 0) {
        languageList.innerHTML = '<div class="language-item">No languages found</div>';
        return;
    }

    languageList.innerHTML = `
        <div class="language-item" onclick="selectLanguage(null)">
            <input type="checkbox" ${selectedLanguages.length === 0 ? 'checked' : ''}>
            <span>All Languages</span>
        </div>
    ` + availableLanguages.map(lang => `
        <div class="language-item" onclick="selectLanguage('${lang}')">
            <input type="checkbox" ${selectedLanguages.includes(lang) ? 'checked' : ''}>
            <span>${lang}</span>
        </div>
    `).join('');
}

function selectLanguage(language) {
    if (language === null) {
        // "All Languages" selected
        selectedLanguages = [];
    } else {
        // Toggle language selection
        const index = selectedLanguages.indexOf(language);
        if (index > -1) {
            selectedLanguages.splice(index, 1);
        } else {
            selectedLanguages.push(language);
        }
    }

    // Update the display - always populate with original search results
    populateLanguages(searchResults);
    displayResults(searchResults);

    // Update button text to show count
    updateLanguageButtonText();
}

function clearLanguageFilters() {
    selectedLanguages = [];
    populateLanguages(searchResults);
    displayResults(searchResults);
    updateLanguageButtonText();
}

function updateLanguageButtonText() {
    const btn = document.getElementById('languageFilterBtn');
    if (selectedLanguages.length > 0) {
        btn.innerHTML = `🔤 Language (${selectedLanguages.length}) <span class="dropdown-arrow">▼</span>`;
        btn.classList.add('active');
    } else {
        btn.innerHTML = `🔤 Language <span class="dropdown-arrow">▼</span>`;
        btn.classList.remove('active');
    }
}

function filterLanguageList() {
    const searchInput = document.getElementById('languageSearch').value.toLowerCase();
    const languageItems = document.querySelectorAll('.language-item');

    languageItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchInput)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Close language dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('languageDropdown');
    const btn = document.getElementById('languageFilterBtn');
    if (dropdown && !dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

async function searchRepos() {
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        alert('Please enter a search query!');
        return;
    }

    const loadingDiv = document.getElementById('loadingDiv');
    const resultsDiv = document.getElementById('resultsDiv');
    const paginationDiv = document.getElementById('paginationDiv');

    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';
    paginationDiv.style.display = 'none';
    currentPage = 1;

    try {
        // Build headers with optional authentication
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };

        if (apiToken) {
            headers['Authorization'] = `token ${apiToken}`;
        }

        const searchQuery = encodeURIComponent(query);

        // Fetch results - GitHub API max is 100 per request
        // We'll fetch 2 pages to get up to 200 results
        const fetchPromises = [];
        const requestedResults = Math.min(200, resultsPerPage * 10); // Get enough for pagination
        const resultsPerRequest = 100;
        const numRequests = Math.ceil(requestedResults / resultsPerRequest);

        for (let page = 1; page <= numRequests; page++) {
            const apiUrl = `https://api.github.com/search/repositories?q=${searchQuery}&per_page=${resultsPerRequest}&page=${page}&sort=stars`;
            fetchPromises.push(fetch(apiUrl, { headers }));
        }

        const responses = await Promise.all(fetchPromises);

        // Extract rate limit from first response
        rateLimitData = {
            limit: parseInt(responses[0].headers.get('X-RateLimit-Limit') || '60'),
            remaining: parseInt(responses[0].headers.get('X-RateLimit-Remaining') || '0'),
            reset: parseInt(responses[0].headers.get('X-RateLimit-Reset') || '0')
        };

        updateRateLimitDisplay();

        // Check if all requests succeeded
        if (!responses.every(r => r.ok)) {
            throw new Error('GitHub API request failed');
        }

        // Parse all responses and combine results
        const dataPromises = responses.map(r => r.json());
        const allData = await Promise.all(dataPromises);

        allResults = [];
        allData.forEach(data => {
            if (data.items) {
                allResults = allResults.concat(data.items);
            }
        });

        searchResults = allResults;
        loadingDiv.style.display = 'none';

        if (allResults.length === 0) {
            resultsDiv.innerHTML = `
                <div class="no-results">
                    <h3>No repositories found</h3>
                    <p>Try adjusting your search query or using different keywords</p>
                </div>
            `;
        } else {
            // Populate language filter dropdown
            populateLanguages(allResults);
            displayResults(allResults);
        }
    } catch (error) {
        loadingDiv.style.display = 'none';
        resultsDiv.innerHTML = `
            <div class="no-results">
                <h3>⚠️ Error</h3>
                <p>${error.message}</p>
                <p>Please check your connection or try again later.</p>
            </div>
        `;
    }
}

function displayResults(repos) {
    const resultsDiv = document.getElementById('resultsDiv');
    const query = document.getElementById('searchInput').value.toLowerCase();

    // Calculate relevance scores
    let scoredRepos = repos.map(repo => {
        const score = calculateRelevanceScore(repo, query);
        return { ...repo, relevanceScore: score };
    });

    // Store original count before filtering
    const totalBeforeLanguageFilter = scoredRepos.length;

    // Apply language filter
    if (selectedLanguages.length > 0) {
        scoredRepos = scoredRepos.filter(repo =>
            repo.language && selectedLanguages.includes(repo.language)
        );
    }

    // Check if language filter removed all results
    const languageFilterActive = selectedLanguages.length > 0;
    const languageFilterHidingResults = languageFilterActive && scoredRepos.length === 0 && totalBeforeLanguageFilter > 0;

    // Apply filters
    if (currentFilter === 'stars') {
        scoredRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    } else if (currentFilter === 'recent') {
        scoredRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else if (currentFilter === 'active') {
        scoredRepos.sort((a, b) => {
            const aActivity = (b.stargazers_count + b.forks_count + b.watchers_count);
            const bActivity = (a.stargazers_count + a.forks_count + a.watchers_count);
            return bActivity - aActivity;
        });
    } else {
        scoredRepos.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // Update allResults with sorted repos
    allResults = scoredRepos;

    // Show message if language filters are hiding all results
    if (languageFilterHidingResults) {
        resultsDiv.innerHTML = `
            <div class="no-results">
                <h3>🔍 No results found</h3>
                <p>Your language filter is hiding all ${totalBeforeLanguageFilter} results.</p>
                <p>Selected languages: <strong>${selectedLanguages.join(', ')}</strong></p>
                <p>Click the <strong>🔤 Language</strong> filter above to adjust your selection, or:</p>
                <button class="clear-filters-btn" onclick="clearLanguageFilters()">Clear Language Filters</button>
            </div>
        `;
        // Don't return - we still want to render pagination
        const paginationDiv = document.getElementById('paginationDiv');
        paginationDiv.style.display = 'none';
        return;
    }

    // Pagination logic
    const startIndex = (currentPage - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedRepos = scoredRepos.slice(startIndex, endIndex);

    resultsDiv.innerHTML = paginatedRepos.map((repo, index) => {
        const scoreClass = repo.relevanceScore >= 80 ? 'score-high' :
                          repo.relevanceScore >= 60 ? 'score-medium' : 'score-low';

        const topics = repo.topics || [];
        const topicsHtml = topics.length > 0 ? `
            <div class="topics">
                ${topics.slice(0, 8).map(topic => `<span class="topic">${topic}</span>`).join('')}
            </div>
        ` : '';

        // Store repo data for score breakdown
        repoDataCache[repo.id] = repo;

        return `
            <div class="repo-card" style="animation-delay: ${index * 0.05}s">
                <img src="${repo.owner.avatar_url}" alt="${repo.owner.login}" class="repo-avatar" loading="lazy">

                <div class="repo-content">
                    <div class="repo-header">
                        <div class="repo-info">
                            <a href="${repo.html_url}" target="_blank" class="repo-title-link">
                                <div class="repo-title">${formatRepoTitle(repo.name)}</div>
                            </a>
                            <div class="repo-owner">
                                <a href="https://github.com/${repo.owner.login}"
                                   target="_blank"
                                   class="owner-link"
                                   data-username="${repo.owner.login}">
                                    ${repo.owner.login}
                                </a>
                            </div>
                        </div>
                        <div class="score-badge ${scoreClass}" onclick="showScoreBreakdown(event, ${repo.id}, '${query}')" title="Click to see score breakdown">
                            ${repo.relevanceScore}% Match
                        </div>
                    </div>

                    <div class="repo-description">
                        ${formatDescription(repo.description)}
                    </div>

                <div class="repo-stats">
                    <button class="stat stat-button" onclick="handleStar(event, ${repo.id})" title="Star this repository">
                        <span class="stat-icon">⭐</span>
                        <span>${formatNumber(repo.stargazers_count)} stars</span>
                    </button>
                    <button class="stat stat-button" onclick="handleFork(event, ${repo.id})" title="Fork this repository">
                        <span class="stat-icon">🔱</span>
                        <span>${formatNumber(repo.forks_count)} forks</span>
                    </button>
                    <button class="stat stat-button" onclick="handleWatch(event, ${repo.id})" title="Watch this repository">
                        <span class="stat-icon">👁️</span>
                        <span>${formatNumber(repo.watchers_count)} watchers</span>
                    </button>
                    ${repo.language ? `
                        <div class="stat">
                            <span class="stat-icon">💻</span>
                            <span>${repo.language}</span>
                        </div>
                    ` : ''}
                    <div class="stat">
                        <span class="stat-icon">🕒</span>
                        <span>Updated ${getTimeAgo(repo.updated_at)}</span>
                    </div>
                </div>

                <div class="repo-actions">
                    <div class="action-dropdown">
                        <button class="action-btn" onclick="toggleCodeDropdown(event, ${repo.id})">
                            <span>💻 Code</span>
                            <span class="dropdown-arrow">▼</span>
                        </button>
                        <div class="dropdown-menu code-dropdown" id="code-${repo.id}">
                            <div class="dropdown-item" onclick="copyCloneUrl(event, ${repo.id})">
                                <span>📋 Clone HTTPS</span>
                                <code class="clone-url">https://github.com/${repo.owner.login}/${repo.name}.git</code>
                            </div>
                            <div class="dropdown-divider"></div>
                            <a href="https://github.com/${repo.owner.login}/${repo.name}/archive/refs/heads/${repo.default_branch || 'main'}.zip"
                               class="dropdown-item download-link"
                               onclick="event.stopPropagation()"
                               download>
                                <span>📦 Download ZIP</span>
                            </a>
                        </div>
                    </div>
                    <div class="action-dropdown">
                        <button class="action-btn" onclick="toggleReleasesDropdown(event, ${repo.id})">
                            <span>🚀 Releases</span>
                            <span class="dropdown-arrow">▼</span>
                        </button>
                        <div class="dropdown-menu releases-dropdown" id="releases-${repo.id}">
                            <div class="dropdown-loading">Loading releases...</div>
                        </div>
                    </div>
                    <div class="action-dropdown">
                        <button class="action-btn preview-btn" onclick="togglePreviewDropdown(event, ${repo.id})">
                            <span>👁️ Live Preview</span>
                            <span class="dropdown-arrow">▼</span>
                        </button>
                        <div class="dropdown-menu preview-dropdown" id="preview-${repo.id}">
                            <div class="dropdown-item" onclick="openInCodeSandbox(event, ${repo.id}, false)">
                                <span>🏖️ Open in CodeSandbox</span>
                            </div>
                            <div class="dropdown-item" onclick="openInStackBlitz(event, ${repo.id}, false)">
                                <span>⚡ Open in StackBlitz</span>
                            </div>
                            <div class="dropdown-divider"></div>
                            <div class="dropdown-item" onclick="openInCodeSandbox(event, ${repo.id}, true)">
                                <span>🖼️ Embed CodeSandbox</span>
                            </div>
                            <div class="dropdown-item" onclick="openInStackBlitz(event, ${repo.id}, true)">
                                <span>🖼️ Embed StackBlitz</span>
                            </div>
                        </div>
                    </div>
                </div>

                    ${topicsHtml}
                </div>
            </div>
        `;
    }).join('');

    // Render pagination controls
    renderPagination();
}

function calculateRelevanceScore(repo, query) {
    let score = 0;
    const queryWords = query.toLowerCase().split(/\s+/);

    // Name match (40 points max)
    const nameMatch = queryWords.some(word =>
        repo.name.toLowerCase().includes(word)
    );
    if (nameMatch) score += 40;

    // Description match (30 points max)
    if (repo.description) {
        const descMatch = queryWords.filter(word =>
            repo.description.toLowerCase().includes(word)
        ).length;
        score += Math.min(30, descMatch * 10);
    }

    // Topic match (20 points max)
    if (repo.topics && repo.topics.length > 0) {
        const topicMatch = queryWords.some(word =>
            repo.topics.some(topic => topic.includes(word))
        );
        if (topicMatch) score += 20;
    }

    // Popularity bonus (10 points max)
    const popularity = Math.log10(repo.stargazers_count + 1);
    score += Math.min(10, popularity * 2);

    return Math.min(100, Math.round(score));
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [name, seconds_in_interval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / seconds_in_interval);
        if (interval >= 1) {
            return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
        }
    }

    return 'just now';
}

// Interactive repository actions
async function handleStar(event, repoId) {
    if (event) event.stopPropagation();

    console.log('handleStar called with repoId:', repoId);
    console.log('repoDataCache:', repoDataCache);

    // Get repo data from cache
    const repoData = repoDataCache[repoId];
    if (!repoData) {
        console.error('Repository data not found in cache for ID:', repoId);
        alert('Error: Repository data not found. Please try refreshing the page.');
        return;
    }

    const owner = repoData.owner.login;
    const repo = repoData.name;

    console.log('Star button clicked:', owner, repo);
    console.log('Full repo data:', repoData);

    // Encode owner and repo names for URL safety
    const encodedOwner = encodeURIComponent(owner);
    const encodedRepo = encodeURIComponent(repo);

    console.log('Encoded:', encodedOwner, encodedRepo);

    if (!apiToken) {
        const confirmed = confirm('⚠️ GitHub authentication required!\n\nTo star repositories from RepoRadar, you need to add your GitHub API token in Settings ⚙️\n\nClassic Token: needs "public_repo" scope\n\nClick OK to open GitHub page to star manually.');
        if (confirmed) {
            window.open(`https://github.com/${encodedOwner}/${encodedRepo}`, '_blank');
        }
        return;
    }

    try {
        const apiUrl = `https://api.github.com/user/starred/${encodedOwner}/${encodedRepo}`;
        console.log('API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${apiToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Length': '0'
            }
        });

        if (response.status === 204) {
            alert(`⭐ Successfully starred ${owner}/${repo}!`);
        } else if (response.status === 404) {
            const errorData = await response.json().catch(() => ({}));
            console.error('404 Error details:', errorData);
            throw new Error(`⚠️ Permission Error\n\nYour classic token needs the "public_repo" scope.\n\nRegenerate your token at github.com/settings/tokens`);
        } else if (response.status === 401) {
            throw new Error('Invalid or expired API token - please update it in Settings ⚙️');
        } else if (response.status === 403) {
            throw new Error('Permission denied - your token lacks starring permissions');
        } else {
            const errorData = await response.text();
            console.error('Star error status:', response.status, errorData);
            throw new Error(`Failed to star repository (HTTP ${response.status})`);
        }
    } catch (error) {
        console.error('Star error:', error);
        const confirmed = confirm(`❌ Error: ${error.message}\n\nClick OK to open GitHub page to star manually.`);
        if (confirmed) {
            window.open(`https://github.com/${encodedOwner}/${encodedRepo}`, '_blank');
        }
    }
}

async function handleFork(event, repoId) {
    if (event) event.stopPropagation();

    // Get repo data from cache
    const repoData = repoDataCache[repoId];
    if (!repoData) {
        console.error('Repository data not found in cache');
        return;
    }

    const forkUrl = `${repoData.html_url}/fork`;
    console.log('Fork button clicked:', forkUrl);
    window.open(forkUrl, '_blank');
}

async function handleWatch(event, repoId) {
    if (event) event.stopPropagation();

    console.log('handleWatch called with repoId:', repoId);
    console.log('repoDataCache:', repoDataCache);

    // Get repo data from cache
    const repoData = repoDataCache[repoId];
    if (!repoData) {
        console.error('Repository data not found in cache for ID:', repoId);
        alert('Error: Repository data not found. Please try refreshing the page.');
        return;
    }

    const owner = repoData.owner.login;
    const repo = repoData.name;

    console.log('Watch button clicked:', owner, repo);
    console.log('Full repo data:', repoData);

    // Encode owner and repo names for URL safety
    const encodedOwner = encodeURIComponent(owner);
    const encodedRepo = encodeURIComponent(repo);

    console.log('Encoded:', encodedOwner, encodedRepo);

    if (!apiToken) {
        const confirmed = confirm('⚠️ GitHub authentication required!\n\nTo watch repositories from RepoRadar, you need to add your GitHub API token in Settings ⚙️\n\nClassic Token: needs "notifications" scope\n\nClick OK to open GitHub page to watch manually.');
        if (confirmed) {
            window.open(`https://github.com/${encodedOwner}/${encodedRepo}`, '_blank');
        }
        return;
    }

    try {
        const apiUrl = `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/subscription`;
        console.log('API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${apiToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subscribed: true })
        });

        if (response.ok) {
            alert(`👁️ Successfully watching ${owner}/${repo}!`);
        } else if (response.status === 404) {
            const errorData = await response.json().catch(() => ({}));
            console.error('404 Error details:', errorData);
            throw new Error(`⚠️ Permission Error\n\nYour classic token needs the "notifications" scope.\n\nRegenerate your token at github.com/settings/tokens`);
        } else if (response.status === 401) {
            throw new Error('Invalid API token');
        } else {
            const errorData = await response.text();
            console.error('Watch error status:', response.status, errorData);
            throw new Error(`Failed to watch repository (HTTP ${response.status})`);
        }
    } catch (error) {
        console.error('Watch error:', error);
        const confirmed = confirm(`❌ Error: ${error.message}\n\nClick OK to open GitHub page to watch manually.`);
        if (confirmed) {
            window.open(`https://github.com/${encodedOwner}/${encodedRepo}`, '_blank');
        }
    }
}

async function handleFollow(event, username) {
    if (event) event.stopPropagation();

    console.log('handleFollow called for user:', username);

    if (!apiToken) {
        const confirmed = confirm('⚠️ GitHub authentication required!\n\nTo follow users from RepoRadar, you need to add your GitHub API token in Settings ⚙️\n\nClassic Token: needs "user:follow" scope\n\nClick OK to open GitHub profile manually.');
        if (confirmed) {
            window.open(`https://github.com/${username}`, '_blank');
        }
        return;
    }

    try {
        // First check if already following
        const checkUrl = `https://api.github.com/user/following/${username}`;
        const checkResponse = await fetch(checkUrl, {
            method: 'GET',
            headers: {
                'Authorization': `token ${apiToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const isFollowing = checkResponse.status === 204;

        if (isFollowing) {
            // Unfollow
            const unfollowUrl = `https://api.github.com/user/following/${username}`;
            const response = await fetch(unfollowUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${apiToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 204) {
                alert(`👤 Unfollowed ${username}!`);
                // Update the button text
                updateFollowButton(username, false);
            } else {
                throw new Error(`Failed to unfollow (HTTP ${response.status})`);
            }
        } else {
            // Follow
            const followUrl = `https://api.github.com/user/following/${username}`;
            const response = await fetch(followUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${apiToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Length': '0'
                }
            });

            if (response.status === 204) {
                alert(`👤 Now following ${username}!`);
                // Update the button text
                updateFollowButton(username, true);
            } else if (response.status === 404) {
                throw new Error(`⚠️ Permission Error\n\nYour classic token needs the "user:follow" scope.\n\nRegenerate your token at github.com/settings/tokens`);
            } else if (response.status === 401) {
                throw new Error('Invalid or expired API token - please update it in Settings ⚙️');
            } else if (response.status === 403) {
                throw new Error('Permission denied - your token lacks user:follow permissions');
            } else {
                throw new Error(`Failed to follow user (HTTP ${response.status})`);
            }
        }
    } catch (error) {
        console.error('Follow error:', error);
        alert(`❌ Error: ${error.message}`);
    }
}

function updateFollowButton(username, isFollowing) {
    const button = document.querySelector(`[data-follow-user="${username}"]`);
    if (button) {
        button.textContent = isFollowing ? '✓ Following' : '+ Follow';
        button.classList.toggle('following', isFollowing);
    }
}

// Code dropdown
function toggleCodeDropdown(event, repoId) {
    event.stopPropagation();
    const dropdown = document.getElementById(`code-${repoId}`);
    closeAllDropdowns(dropdown);
    dropdown.classList.toggle('show');

    // Adjust dropdown position if it's being shown
    if (dropdown.classList.contains('show')) {
        // Small delay to allow browser to render dropdown first
        setTimeout(() => adjustDropdownPosition(dropdown), 10);
    }
}

function copyCloneUrl(event, repoId) {
    event.stopPropagation();

    // Get repo data from cache
    const repoData = repoDataCache[repoId];
    if (!repoData) {
        console.error('Repository data not found in cache');
        return;
    }

    const url = `https://github.com/${repoData.owner.login}/${repoData.name}.git`;

    navigator.clipboard.writeText(url).then(() => {
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = '✅ Copied to clipboard!';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    });
}

// Releases dropdown
let releasesCache = {};

async function toggleReleasesDropdown(event, repoId) {
    event.stopPropagation();

    // Get repo data from cache
    const repoData = repoDataCache[repoId];
    if (!repoData) {
        console.error('Repository data not found in cache');
        return;
    }

    const owner = repoData.owner.login;
    const repo = repoData.name;

    const dropdown = document.getElementById(`releases-${repoId}`);
    closeAllDropdowns(dropdown);

    if (!dropdown.classList.contains('show')) {
        dropdown.classList.add('show');

        // Adjust dropdown position after showing
        setTimeout(() => adjustDropdownPosition(dropdown), 10);

        // Load releases if not cached
        if (!releasesCache[`${owner}/${repo}`]) {
            try {
                const headers = {
                    'Accept': 'application/vnd.github.v3+json'
                };
                if (apiToken) {
                    headers['Authorization'] = `token ${apiToken}`;
                }

                const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=5`, { headers });

                if (!response.ok) throw new Error('Failed to fetch releases');

                const releases = await response.json();
                releasesCache[`${owner}/${repo}`] = releases;

                displayReleases(dropdown, releases, owner, repo);

                // Re-adjust position after content loads
                setTimeout(() => adjustDropdownPosition(dropdown), 10);
            } catch (error) {
                dropdown.innerHTML = '<div class="dropdown-item">No releases available</div>';
                // Re-adjust position after error content loads
                setTimeout(() => adjustDropdownPosition(dropdown), 10);
            }
        } else {
            displayReleases(dropdown, releasesCache[`${owner}/${repo}`], owner, repo);
            // Re-adjust position after cached content loads
            setTimeout(() => adjustDropdownPosition(dropdown), 10);
        }
    } else {
        dropdown.classList.remove('show');
    }
}

function displayReleases(dropdown, releases, owner, repo) {
    if (releases.length === 0) {
        dropdown.innerHTML = '<div class="dropdown-item">No releases available</div>';
        return;
    }

    dropdown.innerHTML = releases.slice(0, 5).map(release => {
        const assets = release.assets || [];
        const assetsHtml = assets.length > 0 ? `
            <div class="release-assets">
                ${assets.map(asset => `
                    <a href="${asset.browser_download_url}"
                       class="asset-download"
                       onclick="event.stopPropagation()"
                       download>
                        📦 ${asset.name} (${formatBytes(asset.size)})
                    </a>
                `).join('')}
            </div>
        ` : '';

        return `
            <div class="release-item">
                <div class="release-header">
                    <span class="release-tag">${release.tag_name}</span>
                    <span class="release-date">${new Date(release.published_at).toLocaleDateString()}</span>
                </div>
                <div class="release-name">${release.name || release.tag_name}</div>
                ${release.body ? `<div class="release-body">${release.body.substring(0, 150)}${release.body.length > 150 ? '...' : ''}</div>` : ''}
                ${assetsHtml}
                <a href="${release.html_url}" target="_blank" class="release-link" onclick="event.stopPropagation()">
                    View full release →
                </a>
            </div>
        `;
    }).join('<div class="dropdown-divider"></div>');
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function closeAllDropdowns(except = null) {
    document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
        if (dropdown !== except) {
            dropdown.classList.remove('show');
        }
    });
}

// Helper function to adjust dropdown position based on viewport
function adjustDropdownPosition(dropdown) {
    // Always start with dropdown-up removed to get accurate measurements
    dropdown.classList.remove('dropdown-up');

    // Force a reflow to ensure measurements are accurate
    dropdown.offsetHeight;

    // Get dropdown position and dimensions
    const dropdownRect = dropdown.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const parentButton = dropdown.closest('.action-dropdown');

    if (!parentButton) return;

    const buttonRect = parentButton.getBoundingClientRect();

    // Calculate space above and below the button
    const spaceAbove = buttonRect.top;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const dropdownHeight = dropdownRect.height;

    console.log('Dropdown positioning:', {
        dropdownHeight,
        spaceAbove,
        spaceBelow,
        viewportHeight,
        dropdownBottom: dropdownRect.bottom,
        wouldOverflow: dropdownRect.bottom > viewportHeight - 20
    });

    // Check if dropdown would overflow bottom of viewport
    const wouldOverflowBottom = dropdownRect.bottom > viewportHeight - 20;

    // If it overflows AND there's more space above, position it upward
    if (wouldOverflowBottom && spaceAbove > dropdownHeight + 40) {
        console.log('✅ Positioning dropdown UPWARD');
        dropdown.classList.add('dropdown-up');
    } else {
        console.log('⬇️ Keeping dropdown DOWNWARD');
    }
}

// Score breakdown popup
function showScoreBreakdown(event, repoId, query) {
    event.stopPropagation();

    // Get the repo data from cache
    const repo = repoDataCache[repoId];
    if (!repo) {
        console.error('Repo data not found in cache');
        return;
    }

    const queryWords = query.toLowerCase().split(/\s+/);

    let breakdown = '<div class="score-breakdown-popup"><div class="score-popup-header">Relevance Score Breakdown</div>';

    // Name match
    const nameMatch = queryWords.some(word => repo.name.toLowerCase().includes(word));
    breakdown += `<div class="score-item ${nameMatch ? 'matched' : ''}">
        <span class="score-label">📝 Name Match:</span>
        <span class="score-value">${nameMatch ? '+40' : '+0'} points</span>
    </div>`;

    // Description match
    let descScore = 0;
    if (repo.description) {
        const descMatch = queryWords.filter(word => repo.description.toLowerCase().includes(word)).length;
        descScore = Math.min(30, descMatch * 10);
    }
    breakdown += `<div class="score-item ${descScore > 0 ? 'matched' : ''}">
        <span class="score-label">📄 Description Match:</span>
        <span class="score-value">+${descScore} points</span>
    </div>`;

    // Topic match
    const topicMatch = repo.topics && repo.topics.length > 0 && queryWords.some(word =>
        repo.topics.some(topic => topic.includes(word))
    );
    breakdown += `<div class="score-item ${topicMatch ? 'matched' : ''}">
        <span class="score-label">🏷️ Topic Match:</span>
        <span class="score-value">${topicMatch ? '+20' : '+0'} points</span>
    </div>`;

    // Popularity
    const popularity = Math.log10(repo.stargazers_count + 1);
    const popScore = Math.min(10, Math.round(popularity * 2));
    breakdown += `<div class="score-item matched">
        <span class="score-label">⭐ Popularity Bonus:</span>
        <span class="score-value">+${popScore} points</span>
    </div>`;

    breakdown += `<div class="score-total">
        <span class="score-label">Total Score:</span>
        <span class="score-value">${repo.relevanceScore}%</span>
    </div></div>`;

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'score-popup-overlay';
    popup.innerHTML = breakdown;
    popup.onclick = (e) => {
        if (e.target === popup) popup.remove();
    };

    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
}

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    closeAllDropdowns();
});

// User profile preview functions
async function showProfilePreview(event, username) {
    event.stopPropagation();

    // Clear any existing timeout
    if (profilePopupTimeout) {
        clearTimeout(profilePopupTimeout);
    }

    // Delay showing the popup slightly
    profilePopupTimeout = setTimeout(async () => {
        // Remove any existing popup
        const existingPopup = document.querySelector('.profile-preview-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create loading popup
        const popup = document.createElement('div');
        popup.className = 'profile-preview-popup';
        popup.innerHTML = '<div class="profile-loading">Loading profile...</div>';
        document.body.appendChild(popup);

        // Position popup near the element
        positionProfilePopup(popup, event.target);

        // Fetch user data
        try {
            let userData;

            // Check cache first
            if (userProfileCache[username]) {
                userData = userProfileCache[username];
            } else {
                // Fetch from GitHub API
                const headers = {
                    'Accept': 'application/vnd.github.v3+json'
                };
                if (apiToken) {
                    headers['Authorization'] = `token ${apiToken}`;
                }

                const response = await fetch(`https://api.github.com/users/${username}`, { headers });

                if (!response.ok) throw new Error('Failed to fetch user data');

                userData = await response.json();
                userProfileCache[username] = userData;
            }

            // Check if we're following this user (only if we have a token)
            let isFollowing = false;
            if (apiToken) {
                try {
                    const checkUrl = `https://api.github.com/user/following/${username}`;
                    const checkResponse = await fetch(checkUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `token ${apiToken}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    isFollowing = checkResponse.status === 204;
                } catch (error) {
                    console.error('Error checking follow status:', error);
                }
            }

            // Update popup with user data
            displayProfilePreview(popup, userData, isFollowing);
            positionProfilePopup(popup, event.target);

        } catch (error) {
            console.error('Error fetching user profile:', error);
            popup.innerHTML = '<div class="profile-error">Failed to load profile</div>';
        }
    }, 500); // 500ms delay before showing
}

function hideProfilePreview() {
    if (profilePopupTimeout) {
        clearTimeout(profilePopupTimeout);
        profilePopupTimeout = null;
    }

    setTimeout(() => {
        const popup = document.querySelector('.profile-preview-popup');
        if (popup && !popup.matches(':hover')) {
            popup.remove();
        }
    }, 200);
}

function positionProfilePopup(popup, targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    // Position below the element by default
    let top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;

    // Adjust if popup goes off right edge
    if (left + popupRect.width > window.innerWidth) {
        left = window.innerWidth - popupRect.width - 20;
    }

    // Adjust if popup goes off bottom edge
    if (rect.bottom + popupRect.height > window.innerHeight) {
        top = rect.top + window.scrollY - popupRect.height - 10;
    }

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
}

function displayProfilePreview(popup, userData, isFollowing = false) {
    const bioHtml = userData.bio ? `<p class="profile-bio">${userData.bio}</p>` : '';
    const locationHtml = userData.location ? `<div class="profile-info-item">📍 ${userData.location}</div>` : '';
    const companyHtml = userData.company ? `<div class="profile-info-item">🏢 ${userData.company}</div>` : '';
    const blogHtml = userData.blog ? `<div class="profile-info-item">🔗 <a href="${userData.blog.startsWith('http') ? userData.blog : 'https://' + userData.blog}" target="_blank" onclick="event.stopPropagation()">${userData.blog}</a></div>` : '';
    const twitterHtml = userData.twitter_username ? `<div class="profile-info-item">🐦 <a href="https://twitter.com/${userData.twitter_username}" target="_blank" onclick="event.stopPropagation()">@${userData.twitter_username}</a></div>` : '';

    popup.innerHTML = `
        <div class="profile-preview-header">
            <img src="${userData.avatar_url}" alt="${userData.login}" class="profile-preview-avatar">
            <div class="profile-preview-names">
                <div class="profile-preview-name">${userData.name || userData.login}</div>
                <div class="profile-preview-username">@${userData.login}</div>
            </div>
        </div>
        ${bioHtml}
        <div class="profile-stats">
            <div class="profile-stat">
                <span class="profile-stat-value">${formatNumber(userData.public_repos)}</span>
                <span class="profile-stat-label">Repositories</span>
            </div>
            <div class="profile-stat">
                <span class="profile-stat-value">${formatNumber(userData.followers)}</span>
                <span class="profile-stat-label">Followers</span>
            </div>
            <div class="profile-stat">
                <span class="profile-stat-value">${formatNumber(userData.following)}</span>
                <span class="profile-stat-label">Following</span>
            </div>
        </div>
        ${locationHtml || companyHtml || blogHtml || twitterHtml ? `
            <div class="profile-additional-info">
                ${locationHtml}
                ${companyHtml}
                ${blogHtml}
                ${twitterHtml}
            </div>
        ` : ''}
        <div class="profile-actions">
            <button class="profile-follow-btn ${isFollowing ? 'following' : ''}"
                    data-follow-user="${userData.login}"
                    onclick="handleFollow(event, '${userData.login}')">
                ${isFollowing ? '✓ Following' : '+ Follow'}
            </button>
            <a href="https://github.com/${userData.login}" target="_blank" class="profile-view-btn" onclick="event.stopPropagation()">
                View Profile →
            </a>
        </div>
    `;

    // Keep popup visible when hovering over it
    popup.onmouseenter = () => {
        if (profilePopupTimeout) {
            clearTimeout(profilePopupTimeout);
        }
    };

    popup.onmouseleave = () => {
        popup.remove();
    };
}

// Live Preview functionality
function togglePreviewDropdown(event, repoId) {
    event.stopPropagation();
    const dropdown = document.getElementById(`preview-${repoId}`);
    closeAllDropdowns(dropdown);
    dropdown.classList.toggle('show');

    // Adjust dropdown position if it's being shown
    if (dropdown.classList.contains('show')) {
        // Small delay to allow browser to render dropdown first
        setTimeout(() => adjustDropdownPosition(dropdown), 10);
    }
}

function openInCodeSandbox(event, repoId, embed = false) {
    event.stopPropagation();

    const repoData = repoDataCache[repoId];
    if (!repoData) {
        console.error('Repository data not found in cache');
        return;
    }

    const owner = repoData.owner.login;
    const repo = repoData.name;
    const url = `https://codesandbox.io/s/github/${owner}/${repo}`;

    if (embed) {
        showPreviewModal(url, 'CodeSandbox', owner, repo);
    } else {
        window.open(url, '_blank');
    }

    closeAllDropdowns();
}

function openInStackBlitz(event, repoId, embed = false) {
    event.stopPropagation();

    const repoData = repoDataCache[repoId];
    if (!repoData) {
        console.error('Repository data not found in cache');
        return;
    }

    const owner = repoData.owner.login;
    const repo = repoData.name;
    const url = `https://stackblitz.com/github/${owner}/${repo}`;

    if (embed) {
        showPreviewModal(url, 'StackBlitz', owner, repo);
    } else {
        window.open(url, '_blank');
    }

    closeAllDropdowns();
}

function showPreviewModal(url, platform, owner, repo) {
    // Remove any existing preview modal
    const existingModal = document.querySelector('.preview-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'preview-modal';
    modal.innerHTML = `
        <div class="preview-modal-content">
            <div class="preview-modal-header">
                <div class="preview-modal-title">
                    <span class="preview-platform-badge">${platform}</span>
                    <span class="preview-repo-name">${owner}/${repo}</span>
                </div>
                <div class="preview-modal-actions">
                    <button class="preview-modal-btn" onclick="window.open('${url}', '_blank')" title="Open in new tab">
                        ↗️ Open in Tab
                    </button>
                    <button class="preview-modal-btn preview-close-btn" onclick="closePreviewModal()" title="Close preview">
                        ✕ Close
                    </button>
                </div>
            </div>
            <div class="preview-iframe-container">
                <div class="preview-loading">
                    <div class="preview-spinner"></div>
                    <p>Loading ${platform} preview...</p>
                    <p class="preview-loading-note">This may take a moment while ${platform} builds the project</p>
                </div>
                <iframe src="${url}" class="preview-iframe" frameborder="0" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    // Handle iframe load to hide loading spinner
    const iframe = modal.querySelector('.preview-iframe');
    const loadingDiv = modal.querySelector('.preview-loading');

    iframe.addEventListener('load', () => {
        loadingDiv.style.display = 'none';
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePreviewModal();
        }
    });
}

function closePreviewModal() {
    const modal = document.querySelector('.preview-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Close preview modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePreviewModal();
    }
});

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function handleScroll() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const scrollThreshold = 300; // Show button after scrolling 300px

    if (window.pageYOffset > scrollThreshold) {
        scrollTopBtn.style.display = 'flex';
    } else {
        scrollTopBtn.style.display = 'none';
    }
}

// Auto-focus search input on load
window.addEventListener('load', () => {
    document.getElementById('searchInput').focus();
    // Only load from localStorage if not logged in
    // Logged-in users get their token from the server via auth.js
    if (!sessionToken || typeof sessionToken === 'undefined') {
        loadApiToken(); // Load saved API token from localStorage
    }
});

// Add scroll event listener
window.addEventListener('scroll', handleScroll);

// Add event delegation for owner profile previews
document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('owner-link') || e.target.closest('.owner-link')) {
        const link = e.target.classList.contains('owner-link') ? e.target : e.target.closest('.owner-link');
        const username = link.getAttribute('data-username');
        if (username) {
            showProfilePreview(e, username);
        }
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('owner-link') || e.target.closest('.owner-link')) {
        hideProfilePreview();
    }
});
