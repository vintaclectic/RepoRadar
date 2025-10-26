# ⚡ RepoRadar Quick Start Guide

Get RepoRadar up and running in **5 minutes**!

## 🎯 What You'll Have

After following this guide, you'll have:
- ✅ A fully functional GitHub search engine
- ✅ Beautiful, professional UI
- ✅ Smart relevance scoring (0-100%)
- ✅ Fast, responsive search results
- ✅ Ready to customize and deploy

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Your GitHub Token (2 minutes)

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Name it: `RepoRadar`
4. Select scope: ✅ `public_repo`
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Open the App (30 seconds)

1. Open `reporadar.html` in a text editor
2. Find line 287:
   ```javascript
   const GITHUB_TOKEN = '';
   ```
3. Paste your token:
   ```javascript
   const GITHUB_TOKEN = 'ghp_your_token_here';
   ```
4. Save the file

### Step 3: Launch! (30 seconds)

1. Double-click `reporadar.html`
2. Or drag it into your browser
3. **Done!** 🎉

### Step 4: Try It Out (2 minutes)

Try searching for:
- "machine learning framework"
- "static site generator"
- "open directory indexer"
- "react component library"

---

## 📖 Usage Tips

### Basic Search
Just type what you're looking for in natural language:
- ✅ "python web scraper"
- ✅ "rust command line tools"
- ✅ "javascript animation library"

### Advanced Search
Use GitHub's search operators:
```
machine learning language:python stars:>1000
react components topic:ui created:>2023-01-01
cli tools language:rust pushed:>2024-01-01
```

### Quick Filters
Click the quick filter buttons for instant searches:
- 🌟 Popular (1000+ stars)
- 🟨 JavaScript projects
- 🐍 Python projects
- 🦀 Rust projects
- 🆕 Recently updated

### Understanding Scores

| Score | Meaning | What to Expect |
|-------|---------|----------------|
| 🟢 80-100% | Perfect match | Exactly what you're looking for |
| 🔵 60-79% | Very good | Highly relevant results |
| 🟡 40-59% | Good | Related but not perfect |
| 🔴 0-39% | Fair | Loosely related |

---

## 🎨 Customize It

### Change Colors

Edit the gradient at line 21:
```css
.gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

Try these color schemes:

**Ocean Blue:**
```css
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
```

**Sunset:**
```css
background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
```

**Forest:**
```css
background: linear-gradient(135deg, #0ba360 0%, #3cba92 100%);
```

**Night:**
```css
background: linear-gradient(135deg, #434343 0%, #000000 100%);
```

### Add Your Logo

Replace line 103:
```html
<h1 class="text-5xl font-bold mb-3 tracking-tight">
    🔍 Repo<span class="text-yellow-300">Radar</span>
</h1>
```

With:
```html
<h1 class="text-5xl font-bold mb-3 tracking-tight">
    <img src="your-logo.png" alt="Your Logo" class="h-12 inline-block">
    Your Name
</h1>
```

### Add More Quick Filters

At line 129, add more buttons:
```html
<button class="filter-btn px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-sm font-medium transition-all" data-filter="language:go">
    🐹 Go
</button>
<button class="filter-btn px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-sm font-medium transition-all" data-filter="language:typescript">
    📘 TypeScript
</button>
```

---

## 🐛 Troubleshooting

### "Error: Bad credentials"
**Problem:** Your GitHub token is invalid or expired

**Solution:**
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Delete the old token
3. Create a new one with `public_repo` scope
4. Update the token in the code

### "No results found"
**Problem:** Your search query is too specific

**Solutions:**
- Try broader keywords
- Remove some filters
- Check spelling
- Try the examples from the empty state

### "Rate limit exceeded"
**Problem:** You've made too many searches

**Solutions:**
- Wait for the limit to reset (check footer)
- Use a GitHub token (5000 requests/hour vs 60)
- Cache your searches (they're already cached in memory!)

### Search is slow
**Problem:** GitHub API might be slow or your connection

**Solutions:**
- Check your internet connection
- Try a simpler query
- Close other tabs using the API

---

## 📱 Next Steps

### Option 1: Deploy Online (Recommended)

**Easiest way - Netlify:**
1. Create a free account at [netlify.com](https://netlify.com)
2. Drag and drop `reporadar.html` onto their dashboard
3. Get a free URL like `reporadar.netlify.app`
4. Add a custom domain (optional)

See **DEPLOYMENT.md** for detailed instructions.

### Option 2: Add Features

Want to make it even better? Check out:
- **ADVANCED_FEATURES.md** - AI search, analytics, and more
- **MOBILE_DEVELOPMENT.md** - Build iOS/Android apps

### Option 3: Customize & Brand

Make it yours:
1. Change colors and fonts
2. Add your logo
3. Customize the scoring algorithm
4. Add your own quick filters

---

## 🎓 Learn More

### Documentation Files

| File | What's Inside |
|------|---------------|
| `README.md` | Full documentation, features, and API reference |
| `DEPLOYMENT.md` | How to deploy to production |
| `MOBILE_DEVELOPMENT.md` | Build mobile apps (iOS & Android) |
| `ADVANCED_FEATURES.md` | AI, analytics, and advanced features |

### Key Features You Have

✅ **Semantic Search** - Understands what you mean, not just keywords
✅ **Smart Scoring** - 0-100% relevance for each result  
✅ **Beautiful UI** - Professional, modern design with animations
✅ **Fast** - Optimized GraphQL queries
✅ **Responsive** - Works on desktop, tablet, and mobile
✅ **No Backend Needed** - Runs entirely in the browser

### GitHub API Limits

| Type | Requests/Hour |
|------|---------------|
| No token | 60 |
| With token | 5,000 |
| GitHub App | 15,000 |

You're using: **With token (5,000/hour)** ✅

---

## 🎯 Common Use Cases

### 1. Finding Libraries
**Search:** "javascript date picker"
**Use Case:** Need a component for your project

### 2. Learning New Tech
**Search:** "rust beginner projects"
**Use Case:** Want to learn by example

### 3. Staying Updated
**Search:** "AI tools pushed:>2024-10-01"
**Use Case:** Find the latest tools

### 4. Code Quality
**Search:** "testing framework language:python stars:>1000"
**Use Case:** Find well-maintained tools

### 5. Finding Alternatives
**Search:** "webpack alternative"
**Use Case:** Looking for different options

---

## 💡 Pro Tips

### 1. Use Keyboard Shortcuts
- Press **Enter** to search
- Click repo name to open in new tab

### 2. Combine Filters
```
machine learning language:python stars:>1000 pushed:>2024-01-01
```

### 3. Save Good Searches
Your recent searches are cached automatically!

### 4. Check the Score
High scores (80-100%) mean it's exactly what you need

### 5. Explore Topics
Click topic tags to find similar repos

---

## 🆘 Need Help?

### Check the Docs
- `README.md` - Full documentation
- `DEPLOYMENT.md` - Deployment issues
- `MOBILE_DEVELOPMENT.md` - Mobile app help

### Common Questions

**Q: Is this legal?**  
A: Yes! ✅ GitHub's API terms allow third-party apps.

**Q: Can I use this commercially?**  
A: Yes! It's MIT licensed.

**Q: Can I modify it?**  
A: Absolutely! Customize away.

**Q: Do I need a server?**  
A: Nope! It runs in the browser.

**Q: Can I make mobile apps?**  
A: Yes! See MOBILE_DEVELOPMENT.md

---

## 🎉 You're All Set!

You now have a **powerful GitHub search engine** that's:
- 🚀 Faster than GitHub's native search
- 🎯 More accurate with relevance scoring
- 💅 Beautiful and professional
- 🔧 Easy to customize
- 📱 Ready to become a mobile app

### What's Next?

1. **Use it**: Start searching for repos
2. **Customize it**: Make it yours
3. **Deploy it**: Share with the world
4. **Extend it**: Add advanced features

---

## 🌟 Share Your Creation

Built something cool with RepoRadar?
- Share it on Twitter/X
- Show it on Reddit
- Post on Product Hunt
- Write a blog post

Tag it with `#RepoRadar` so others can find it!

---

**Happy searching! 🔍✨**

*Made with ❤️ for developers who deserve better tools*