# 🚀 RepoRadar - Step-by-Step Deployment Guide

## Complete Walkthrough: From Code to Live Website

---

## PART 1: Prepare Your Code (5 minutes)

### Step 1: Check Your Git Status

```bash
git status
```

**What you'll see:**
```
On branch main
Changes not staged for commit:
  modified:   src/js/auth.js
  modified:   src/js/app.js
  ...
```

### Step 2: Commit All Changes

```bash
git add .
git commit -m "Add authentication system and prepare for deployment"
```

**What you'll see:**
```
[main abc1234] Add authentication system and prepare for deployment
 15 files changed, 847 insertions(+), 23 deletions(-)
```

### Step 3: Push to GitHub

```bash
git push origin main
```

**What you'll see:**
```
Enumerating objects: 45, done.
Counting objects: 100% (45/45), done.
Writing objects: 100% (25/25), 12.45 KiB | 1.56 MiB/s, done.
Total 25 (delta 18), reused 0 (delta 0)
To https://github.com/yourusername/RepoRadar.git
   abc1234..def5678  main -> main
```

✅ **Your code is now on GitHub!**

---

## PART 2: Deploy Backend to Render.com (10 minutes)

### Step 1: Go to Render.com

1. Open your browser
2. Go to: **https://render.com**
3. Click **"Get Started"** or **"Sign Up"**

### Step 2: Sign Up with GitHub

1. Click **"GitHub"** button
2. You'll be redirected to GitHub
3. Click **"Authorize Render"**
4. You'll be redirected back to Render

✅ **You're now logged into Render!**

### Step 3: Create a Web Service

1. You'll see the Render Dashboard
2. Click the **"New +"** button (top right)
3. Click **"Web Service"**

**What you'll see:**
- A list of your GitHub repositories

### Step 4: Connect Your Repository

1. Find **"RepoRadar"** in the list
2. Click **"Connect"**

**If you don't see your repo:**
- Click "Configure account" link
- Select your GitHub account
- Give Render access to your repositories
- Go back and refresh

### Step 5: Configure Your Service

You'll see a form with these fields. Fill them in:

**Field: Name**
- Type: `reporadar` (or any name you want)

**Field: Region**
- Select: "Oregon (US West)" or closest to you

**Field: Branch**
- Leave as: `main`

**Field: Root Directory**
- Leave EMPTY (blank)

**Field: Runtime**
- It should auto-detect: `Node`

**Field: Build Command**
- Type: `npm install`

**Field: Start Command**
- Type: `node server/server.js`

**Field: Instance Type**
- Select: **Free**

### Step 6: Add Environment Variable

1. Scroll down to **"Advanced"**
2. Click **"Advanced"** to expand
3. Click **"Add Environment Variable"**

**Add this:**
- **Key**: `PORT`
- **Value**: `10000`

**Add another one:**
- **Key**: `NODE_ENV`
- **Value**: `production`

### Step 7: Deploy!

1. Scroll to the bottom
2. Click **"Create Web Service"**

**What happens next:**
- Render starts deploying your app
- You'll see a log stream showing the deployment progress
- This takes 5-10 minutes

**You'll see logs like:**
```
==> Cloning from https://github.com/yourusername/RepoRadar...
==> Running 'npm install'
added 201 packages in 34s
==> Running 'node server/server.js'
🚀 RepoRadar server running on http://localhost:10000
Connected to SQLite database
Users table ready
GitHub tokens table ready
Sessions table ready
```

### Step 8: Get Your Backend URL

1. Once deployment is complete, you'll see: **"Live"** with a green dot
2. At the top of the page, you'll see your URL:
   - Example: **`https://reporadar-abc123.onrender.com`**
3. **COPY THIS URL!** You'll need it in the next step

✅ **Your backend is live!**

---

## PART 3: Update Frontend with Backend URL (2 minutes)

### Step 1: Update auth.js

1. Open `src/js/auth.js` in your code editor
2. Find line 8 (around there):

```javascript
? 'https://reporadar.onrender.com/api'  // Change this to your deployed backend URL
```

3. Replace with YOUR Render URL (the one you just copied):

```javascript
? 'https://reporadar-abc123.onrender.com/api'  // <-- YOUR URL HERE
```

### Step 2: Commit and Push

```bash
git add src/js/auth.js
git commit -m "Update API URL for production"
git push origin main
```

**What happens:**
- Render auto-detects the push
- Automatically redeploys your backend
- Takes ~2-3 minutes

✅ **Backend updated with correct URL!**

---

## PART 4: Deploy Frontend to Vercel (5 minutes)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

**What you'll see:**
```
added 1 package in 2s
```

### Step 2: Navigate to Frontend

```bash
cd src
```

### Step 3: Deploy to Vercel

```bash
vercel
```

**You'll see prompts. Here's what to answer:**

**Prompt 1:**
```
? Set up and deploy "~/RepoRadar/src"? [Y/n]
```
**Answer:** Press `Enter` (Yes)

**Prompt 2:**
```
? Which scope do you want to deploy to?
```
**Answer:** Press `Enter` (your account)

**Prompt 3:**
```
? Link to existing project? [y/N]
```
**Answer:** Type `n` and press `Enter`

**Prompt 4:**
```
? What's your project's name?
```
**Answer:** Type `reporadar` and press `Enter`

**Prompt 5:**
```
? In which directory is your code located?
```
**Answer:** Press `Enter` (current directory: ./)

**What happens next:**
- Vercel uploads your files
- Deploys your frontend
- Takes ~30 seconds

**You'll see:**
```
✅  Preview: https://reporadar-xyz123.vercel.app
✅  Production: https://reporadar.vercel.app
```

### Step 4: Deploy to Production

```bash
vercel --prod
```

**What you'll see:**
```
🔍  Inspect: https://vercel.com/...
✅  Production: https://reporadar.vercel.app [1s]
```

**COPY YOUR FRONTEND URL:** `https://reporadar.vercel.app`

✅ **Your frontend is live!**

---

## PART 5: Update CORS Settings (3 minutes)

### Step 1: Update server.js

1. Go back to project root:
```bash
cd ..
```

2. Open `server/server.js`
3. Find line 13 (around there):

```javascript
? ['https://reporadar.vercel.app', 'https://reporadar.onrender.com']
```

4. Update with YOUR URLs:

```javascript
? ['https://reporadar.vercel.app', 'https://reporadar-abc123.onrender.com']
```

### Step 2: Commit and Push

```bash
git add server/server.js
git commit -m "Update CORS for production frontend"
git push origin main
```

**What happens:**
- Render auto-redeploys
- Takes ~2-3 minutes

✅ **CORS configured!**

---

## PART 6: Test Your Live Site! (2 minutes)

### Step 1: Visit Your Site

1. Open your browser
2. Go to: `https://reporadar.vercel.app` (your URL)

### Step 2: Test Registration

1. You should see the login/signup modal
2. Click **"Sign up"**
3. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
4. Click **"Sign Up"**

**What you should see:**
- "Account created successfully!" message
- Modal closes
- You see "Hello, testuser!" in top right

### Step 3: Test Token Saving

1. Click the ⚙️ Settings button
2. Paste your GitHub token
3. Click "💾 Save Token"

**What you should see:**
- "⏳ Validating token..."
- "✅ Token validated and saved permanently!"

### Step 4: Test Persistence

1. Close the tab completely
2. Open a new tab
3. Go to your site again

**What you should see:**
- You're still logged in!
- Your token is still there!

✅ **Everything works!**

---

## 🎯 YOUR LIVE URLS

**Frontend (Users visit this):**
`https://reporadar.vercel.app`

**Backend API:**
`https://reporadar-abc123.onrender.com`

---

## 📱 Share Your Site!

Your site is now live and accessible from anywhere! Share it:

```
Check out RepoRadar - GitHub Repository Search with Authentication!
🔗 https://reporadar.vercel.app
```

---

## 🔧 Important Notes

### Free Tier Limitations

**Render (Backend):**
- Sleeps after 15 min of no activity
- Wakes up in ~30 seconds on first request
- This is normal for free tier

**Vercel (Frontend):**
- No sleep time
- Always fast
- 100GB bandwidth/month

### Making Updates

Whenever you want to update your site:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

**Both services auto-deploy!**
- Render: Auto-deploys backend (~2-3 min)
- Vercel: Run `vercel --prod` in src folder (~30 sec)

### Database Backups

Your database is at: `server/reporadar.db` on Render

**To backup:**
1. Go to Render Dashboard
2. Click your service
3. Click "Shell" tab
4. Run: `cat server/reporadar.db > backup.db`
5. Download the file

---

## 🆘 Troubleshooting

### "Cannot connect to server"

**Check:**
1. Is Render service "Live" (green dot)?
2. Is the API URL in `auth.js` correct?
3. Open browser DevTools (F12) → Console → Check for errors

**Fix:**
- Wait 30 seconds (Render waking up from sleep)
- Double-check URLs match

### "CORS Policy Error"

**Fix:**
1. Update `server/server.js` with your Vercel URL
2. Push to GitHub
3. Wait for Render to redeploy

### "Session expired"

**This is normal** - Sessions last 30 days. Just login again!

### Database Lost

**This shouldn't happen**, but if it does:
- Check Render logs for errors
- Database persists on Render's servers
- Contact Render support if needed

---

## ✅ Deployment Checklist

Before going live:
- ✅ Code pushed to GitHub
- ✅ Backend deployed to Render
- ✅ Frontend deployed to Vercel
- ✅ API URL updated in auth.js
- ✅ CORS configured in server.js
- ✅ Tested registration
- ✅ Tested login
- ✅ Tested token saving
- ✅ Tested persistence

After going live:
- ✅ Monitor Render logs for errors
- ✅ Test from different devices
- ✅ Share with users!

---

## 🎉 You're Live!

Congratulations! Your RepoRadar app is now:
- ✅ Live on the internet
- ✅ Accessible from anywhere
- ✅ Saving user data permanently
- ✅ Free to use (within limits)
- ✅ Auto-deploying on updates

**Share your live URL and enjoy your app!** 🚀
