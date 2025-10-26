# 🚀 Deploy RepoRadar NOW - Quick Start

## ⚡ Fastest Way to Deploy (5 minutes)

### Option 1: Render.com (RECOMMENDED)

**Step 1: Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

**Step 2: Deploy Backend to Render**
1. Go to https://render.com and sign up with GitHub
2. Click "New +" → "Web Service"
3. Select your RepoRadar repository
4. Fill in:
   - **Name**: `reporadar`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/server.js`
   - **Instance Type**: Free
5. Click "Advanced" and add:
   - **Environment Variable**: `PORT` = `10000`
6. Click "Create Web Service"
7. Wait 5-10 minutes
8. **Copy your URL**: `https://reporadar-xxxx.onrender.com`

**Step 3: Update Frontend**
1. Open `src/js/auth.js`
2. Find line 8: `? 'https://reporadar.onrender.com/api'`
3. Replace with YOUR Render URL: `https://reporadar-xxxx.onrender.com/api`
4. Save and commit:
```bash
git add src/js/auth.js
git commit -m "Update API URL for production"
git push origin main
```

**Step 4: Deploy Frontend to Vercel**
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd src
vercel --prod
```

3. Follow the prompts and you'll get a URL like:
   `https://reporadar.vercel.app`

**Step 5: Update CORS**
1. Open `server/server.js`
2. Line 13: Add your Vercel URL to the array
3. Commit and push:
```bash
git add server/server.js
git commit -m "Update CORS for production"
git push origin main
```

**✅ DONE! Your site is live!**

---

### Option 2: Railway.app (EASIER)

**Step 1: Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

**Step 2: Deploy to Railway**
1. Go to https://railway.app and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects everything!
5. Click "Settings" → "Generate Domain"
6. Get your URL: `https://reporadar.up.railway.app`

**Step 3: Update Frontend and Deploy**
Same as Render Option steps 3-5

---

## 📝 Quick Checklist

Before deployment:
- ✅ Code is on GitHub
- ✅ `.gitignore` includes `server/reporadar.db`
- ✅ Environment variables configured
- ✅ CORS configured in server.js
- ✅ API URL auto-detection in auth.js

After deployment:
- ✅ Test user registration
- ✅ Test login
- ✅ Test token saving
- ✅ Test GitHub API calls

---

## 🎯 Your Live URLs

After deployment, you'll have:

**Backend API**: `https://reporadar.onrender.com` (or Railway URL)
**Frontend**: `https://reporadar.vercel.app`

Users can now:
1. Visit your frontend URL
2. Create an account
3. Save their GitHub token
4. Access it from any device!

---

## 🔧 Important Notes

1. **Free Tier Limitations**:
   - Render: Sleeps after 15 min of inactivity (wakes up in ~30 seconds)
   - Railway: $5 credit/month
   - Vercel: No sleep

2. **First Load Might Be Slow**: 
   - Render free tier takes 30 seconds to wake up
   - This is normal for free hosting

3. **Database**:
   - SQLite database is created automatically
   - Persists on Render/Railway servers
   - Back it up periodically from the dashboard

4. **Updates**:
   - Just `git push origin main`
   - Render/Railway auto-deploy
   - Vercel: run `vercel --prod` again

---

## 🆘 Troubleshooting

**"Cannot connect to server"**
- Check if backend URL in `auth.js` is correct
- Check if Render service is running

**"CORS error"**
- Add your Vercel URL to CORS origins in `server.js`
- Redeploy backend

**"Database error"**
- Database creates automatically on first run
- Check Render logs for errors

---

## 🎉 You're Ready!

Your RepoRadar site will be:
- ✅ Live on the internet
- ✅ Accessible from anywhere
- ✅ Free to use
- ✅ Auto-deploying on push

Share your live URL with the world! 🌍
