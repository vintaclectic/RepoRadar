# RepoRadar - Enhanced GitHub Repository Search

**Tagline:** *Discover GitHub repositories with AI-powered intelligence*

RepoRadar is a beautiful, intelligent GitHub search engine that goes beyond simple keyword matching to find exactly what you're looking for. Built with a smart relevance scoring system and authentication, it helps developers discover repositories that truly match their needs.

---

## 🚀 Development Environment

### Project Structure
```
RepoRadar/
├── server/                 # Backend server
│   ├── server.js          # Express API
│   ├── database.js        # Database management
│   └── reporadar.db       # SQLite database
├── docs/                   # Documentation
│   ├── README.md
│   ├── DEPLOYMENT.md
│   └── QUICK_START.md
├── reporadar.html         # Single-file frontend
├── package.json           # Dependencies and scripts
└── .gitignore
```

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start backend server:**
   ```bash
   npm run server:dev
   ```

3. **Open frontend:**
   - Open `reporadar.html` in your browser

---

## ✨ Features

### 🧠 **Intelligent Search**
- **Smart Relevance Scoring**: 0-100% match rating for each result
- **Multi-factor Analysis**: Evaluates repository name, description, topics, and popularity
- **Contextual Understanding**: Matches meaning, not just keywords

### 🔐 **Authentication System**
- User registration and login
- Session management
- Secure GitHub token storage
- Password hashing with bcrypt

### 🎨 **Beautiful UI**
- **Modern Design**: Gradient backgrounds and smooth animations
- **Hover Effects**: Interactive cards with elevation on hover
- **Responsive**: Works perfectly on mobile, tablet, and desktop
- **Color-Coded Scores**:
  - 🟢 Green (80-100%): Excellent match
  - 🔴 Pink (60-79%): Good match
  - 🟡 Yellow (0-59%): Moderate match

### 🔧 **Advanced Filters**
- ⭐ **Most Stars**: Sort by popularity
- 🕒 **Recent**: Find recently updated repos
- 🔥 **Most Active**: Discover highly engaged projects
- 🔤 **Language**: Filter by programming language

---

## 🎯 Scoring Algorithm

RepoRadar uses a sophisticated scoring system that considers multiple factors:

```
Score = NameMatch(40pts) + DescriptionMatch(30pts) + TopicMatch(20pts) + PopularityBonus(10pts)
```

### **Scoring Breakdown:**
1. **Name Match (40 points)**: Does the repo name contain query keywords?
2. **Description Match (30 points)**: How many query words appear in the description?
3. **Topic Match (20 points)**: Do repository topics align with the query?
4. **Popularity Bonus (10 points)**: Logarithmic bonus based on stars

---

## 🛠️ Tech Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with animations and gradients
- **JavaScript (ES6+)**: Async/await, fetch API
- **GitHub REST API**: Repository search and data retrieval

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **SQLite3**: Database
- **bcryptjs**: Password hashing
- **CORS**: Cross-origin resource sharing

---

## 📦 NPM Scripts

- `npm start` - Start dev server
- `npm run server` - Start backend server
- `npm run server:dev` - Start backend with auto-reload

---

## 🚀 Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment instructions.

### Quick Deploy Options:
- **Backend**: Render, Railway, Heroku
- **Frontend**: GitHub Pages, Vercel, Netlify

---

## 📄 License

This project is open source and available under the MIT License.

---

**Made with ❤️ for developers who love finding great code**
