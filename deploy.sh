#!/bin/bash

echo "🚀 RepoRadar Deployment Script"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not initialized!"
    echo "Run: git init"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "📝 You have uncommitted changes."
    read -p "Do you want to commit them now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
    fi
fi

echo ""
echo "✅ Preparing for deployment..."
echo ""

# Display deployment options
echo "Choose your deployment platform:"
echo "1. Render.com (Recommended - Full stack with database)"
echo "2. Railway.app (Easy deployment)"
echo "3. Just push to GitHub (manual deployment)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📦 Deploying to Render.com"
        echo ""
        echo "Next steps:"
        echo "1. Push your code: git push origin main"
        echo "2. Go to https://render.com"
        echo "3. Create a Web Service and connect your GitHub repo"
        echo "4. Use these settings:"
        echo "   - Build Command: npm install"
        echo "   - Start Command: node server/server.js"
        echo "   - Add Environment Variable: PORT=10000"
        echo ""
        read -p "Push to GitHub now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            echo "✅ Pushed to GitHub! Now go to Render.com to complete deployment."
        fi
        ;;
    2)
        echo ""
        echo "🚂 Deploying to Railway.app"
        echo ""
        echo "Next steps:"
        echo "1. Push your code: git push origin main"
        echo "2. Go to https://railway.app"
        echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "4. Railway will auto-detect and deploy your app"
        echo ""
        read -p "Push to GitHub now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            echo "✅ Pushed to GitHub! Now go to Railway.app to complete deployment."
        fi
        ;;
    3)
        echo ""
        echo "📤 Pushing to GitHub..."
        git push origin main
        echo "✅ Pushed to GitHub!"
        ;;
    *)
        echo "Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "📖 For detailed deployment instructions, see DEPLOYMENT_GUIDE.md"
