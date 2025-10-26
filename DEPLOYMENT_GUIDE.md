# RepoRadar - Live Deployment Guide

## Quick Deploy Options

### Option 1: Render.com (Recommended - FREE)
**Best for: Full-stack apps with database**

#### Steps:

1. **Prepare your code:**
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

2. **Go to [Render.com](https://render.com) and sign up**

3. **Create a Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `reporadar`
     - **Region**: Choose closest to you
     - **Branch**: `main`
     - **Root Directory**: Leave empty
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node server/server.js`
     - **Instance Type**: `Free`

4. **Add Environment Variable:**
   - Click "Advanced" → "Add Environment Variable"
   - Key: `PORT`
   - Value: `10000`

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your backend will be at: `https://reporadar.onrender.com`

6. **Update Frontend API URL:**
   - After deployment, you'll get a URL like `https://reporadar.onrender.com`
   - We'll update the frontend to use this URL

---

### Option 2: Railway.app (EASY - FREE)
**Best for: Simple deployment**

#### Steps:

1. **Go to [Railway.app](https://railway.app) and sign up**

2. **Click "New Project"**
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Railway will auto-detect Node.js

3. **Configure:**
   - Railway auto-detects `package.json`
   - It will run `npm install` and `npm start`

4. **Add Environment Variables:**
   - Click on your project → "Variables"
   - Add: `PORT` (Railway will auto-assign)

5. **Generate Domain:**
   - Click "Settings" → "Generate Domain"
   - You'll get: `https://reporadar.up.railway.app`

---

### Option 3: Vercel + Backend Serverless (FREE)
**Best for: Frontend with serverless backend**

#### Frontend Deployment:

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy Frontend:**
```bash
cd src
vercel
```

3. **Follow prompts:**
   - Set up and deploy: `Y`
   - Scope: Your account
   - Link to existing project: `N`
   - Project name: `reporadar`
   - Directory: `./`
   - Override settings: `N`

#### Backend (Need separate hosting for this - use Render or Railway)

---

## Step-by-Step: Render Deployment (Recommended)

### Step 1: Prepare Repository

Create a `.gitignore` if you haven't:
```bash
echo "node_modules/
server/reporadar.db
.env
*.log" > .gitignore
```

### Step 2: Update Server for Production

I'll create a production-ready server file for you.

### Step 3: Update Frontend API URL

After deployment, update `src/js/auth.js` to use your production URL:

```javascript
// Change this line:
const API_BASE = 'http://localhost:3000/api';

// To your Render URL:
const API_BASE = 'https://reporadar.onrender.com/api';
```

### Step 4: Deploy to Render

1. **Push to GitHub:**
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

2. **Create Render Account:**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create Web Service:**
   - Dashboard → "New +" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Build Command**: `npm install`
     - **Start Command**: `node server/server.js`
     - **Auto-Deploy**: Yes

4. **Wait for Deployment** (5-10 minutes)

5. **Get Your URL:**
   - Example: `https://reporadar.onrender.com`

### Step 5: Deploy Frontend to Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Update CORS in Backend:**
   - Add your Vercel URL to allowed origins

---

## Environment Variables

### Production Environment Variables

Create these in your hosting platform:

```
PORT=10000
NODE_ENV=production
```

---

## Domain Setup (Optional)

### Connect Custom Domain:

**On Render:**
1. Settings → "Custom Domain"
2. Add your domain (e.g., `reporadar.com`)
3. Update DNS records at your domain provider

**DNS Records:**
```
Type: CNAME
Name: www
Value: reporadar.onrender.com
```

---

## Security Checklist for Production

- ✅ Environment variables for sensitive data
- ✅ HTTPS enabled (automatic on Render/Railway/Vercel)
- ✅ CORS configured for your frontend domain
- ✅ Database backed up regularly
- ✅ Password hashing (already implemented with bcrypt)
- ✅ Session token security (already implemented)

---

## Monitoring & Maintenance

### Check Logs:
- **Render**: Dashboard → Your service → "Logs"
- **Railway**: Project → "Deployments" → Click deployment → "Logs"

### Database Backup:
- Download `reporadar.db` periodically
- On Render: Use "Shell" to access and download database

### Update Deployment:
```bash
git add .
git commit -m "Update features"
git push origin main
# Auto-deploys on Render/Railway
```

---

## Cost Breakdown

### Free Tier Limits:

**Render:**
- ✅ 750 hours/month free
- ✅ 100GB bandwidth
- ✅ Auto-sleep after 15 min inactivity (free tier)
- ✅ Unlimited projects

**Railway:**
- ✅ $5 free credit/month
- ✅ ~500 hours of uptime
- ✅ No auto-sleep

**Vercel:**
- ✅ 100GB bandwidth
- ✅ Unlimited projects
- ✅ No auto-sleep

### Recommended: Use Render for both backend + database (FREE)

---

## Troubleshooting

### Issue: "Cannot connect to API"
**Fix:** Update `API_BASE` in `src/js/auth.js` to your production URL

### Issue: "Database not found"
**Fix:** The database is created automatically on first run

### Issue: "Port already in use"
**Fix:** Use `PORT` environment variable (Render handles this)

### Issue: "CORS error"
**Fix:** Update allowed origins in `server/server.js`

---

## Next Steps After Deployment

1. ✅ Test registration and login
2. ✅ Test token saving
3. ✅ Test across different devices
4. ✅ Share your live URL!
5. ✅ Monitor logs for errors
6. ✅ Set up custom domain (optional)

---

## Quick Commands

```bash
# Commit and push
git add .
git commit -m "Deploy to production"
git push origin main

# View production logs (Render)
# Go to: https://dashboard.render.com → Your service → Logs

# Update deployment
git push origin main  # Auto-deploys
```

---

## Your URLs After Deployment

**Backend API:** `https://reporadar.onrender.com`
**Frontend:** `https://reporadar.vercel.app`

**Custom Domain (optional):**
- `https://reporadar.com`
- `https://www.reporadar.com`

---

**Ready to deploy? Let's start with Render!** 🚀
