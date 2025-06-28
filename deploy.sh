#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "🏗️ Building frontend..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'railway login' to login to Railway"
echo "2. Run 'railway init' in project root to initialize Railway project"
echo "3. Run 'railway up' to deploy backend"
echo "4. Add environment variables in Railway dashboard"
echo "5. Run 'vercel' in frontend directory to deploy frontend"
echo "6. Add VITE_API_URL environment variable in Vercel dashboard"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions" 