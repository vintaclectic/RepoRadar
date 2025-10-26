# 🚀 RepoRadar - Deployment Guide

## Quick Start

**No setup required!** Just open `reporadar.html` in any browser.

---

## Deployment Options

### **1. Netlify (Easiest)**
```bash
netlify deploy --prod --dir=.
```

### **2. Vercel**
```bash
vercel --prod
```

### **3. GitHub Pages**
- Push files to GitHub
- Enable Pages in repository Settings
- Live at: `https://username.github.io/reporadar`

---

## Mobile App Conversion

### **React Native**
```bash
npx react-native init RepoRadar
# Copy logic to React Native components
```

---

## GitHub Token Setup

1. GitHub Settings → Developer Settings → Tokens
2. Generate token with `public_repo` scope
3. Add to code:

```javascript
'Authorization': 'token YOUR_TOKEN'
```

---

## Backend API (Optional)

For rate limit increase and caching:

```javascript
// server.js
const express = require('express');
const { Octokit } = require('@octokit/rest');

const app = express();
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

app.get('/api/search', async (req, res) => {
    const result = await octokit.search.repos({
        q: req.query.q,
        per_page: 30
    });
    res.json(result.data);
});

app.listen(3000);
```

---

## Customization

### Change Colors
```css
/* In reporadar.html */
background: linear-gradient(135deg, #YOUR_COLOR1, #YOUR_COLOR2);
```

### Adjust Scoring
```javascript
// In calculateRelevanceScore()
if (nameMatch) score += 50;  // Increase from 40
```

---

## Performance Tips

- Add caching for repeated searches
- Implement debouncing for search input
- Use pagination for large result sets
- Consider GraphQL for fewer API calls

---

**Ready to deploy!** 🎉
