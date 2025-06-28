# 🚀 Deployment Guide

This guide will help you deploy your Internship Tracking System to production using free services.

## 📋 Prerequisites

1. GitHub account
2. Railway account (railway.app)
3. Vercel account (vercel.com)

## 🔧 Step 1: Prepare Your Code

### 1.1 Update API Configuration

The frontend is already configured to use environment variables. Make sure your API calls use the base URL from `src/config/api.js`.

### 1.2 Environment Variables Setup

Copy the example files and update them:

**Backend:**

```bash
cp backend/env.example backend/.env
```

**Frontend:**

```bash
cp frontend/env.example frontend/.env
```

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2.2 Deploy Backend

```bash
# Navigate to project root
cd /path/to/your/project

# Login to Railway
railway login

# Initialize Railway project
railway init

# Deploy
railway up
```

### 2.3 Configure Environment Variables in Railway

Go to your Railway dashboard and add these environment variables:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_here_at_least_32_characters
CORS_ORIGIN=https://your-app-name.vercel.app
```

### 2.4 Add Database

In Railway dashboard:

1. Click "New" → "Database" → "PostgreSQL"
2. Railway will automatically set the `DATABASE_URL` environment variable

### 2.5 Run Database Migrations

In Railway dashboard terminal:

```bash
cd backend && npm run seed
```

## ⚡ Step 3: Deploy Frontend to Vercel

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Deploy Frontend

```bash
# Navigate to frontend directory
cd frontend

# Deploy to Vercel
vercel

# Follow the prompts:
# - Connect to GitHub? Yes
# - Link to existing project? No
# - Project name: your-internship-app
# - Directory: ./
# - Override settings? No
```

### 3.3 Configure Environment Variables in Vercel

In Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://your-railway-app.railway.app`

### 3.4 Redeploy Frontend

```bash
vercel --prod
```

## 🔒 Step 4: Update CORS Configuration

Update the `CORS_ORIGIN` environment variable in Railway with your Vercel URL:

```
CORS_ORIGIN=https://your-app-name.vercel.app
```

## 🎯 Step 5: Final Configuration

### 5.1 Update API Base URL

In your frontend `src/config/api.js`, update the production URL:

```javascript
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://your-actual-railway-url.railway.app"
    : "http://localhost:5000");
```

### 5.2 Test Your Deployment

1. Visit your Vercel URL
2. Try logging in with the default admin account
3. Test creating users, programs, and diary entries

## 🔧 Troubleshooting

### Common Issues:

**1. CORS Errors:**

- Make sure `CORS_ORIGIN` in Railway matches your Vercel URL exactly
- No trailing slash in URLs

**2. Database Connection Issues:**

- Check that `DATABASE_URL` is set in Railway
- Run the seed command to populate initial data

**3. API Not Found:**

- Verify `VITE_API_URL` in Vercel environment variables
- Check that Railway service is running

**4. Build Failures:**

- Check build logs in Railway/Vercel dashboards
- Ensure all dependencies are in package.json

## 📱 Default Login Credentials

After deployment, you can login with:

- **Email:** admin@university.edu
- **Password:** admin123

**⚠️ Important:** Change the default password immediately after first login!

## 🔄 Automatic Deployments

Both Railway and Vercel are configured for automatic deployments:

- **Backend:** Deploys automatically when you push to the main branch
- **Frontend:** Deploys automatically when you push to the main branch

## 📊 Monitoring

- **Railway:** Check logs and metrics in Railway dashboard
- **Vercel:** Monitor performance and deployments in Vercel dashboard

## 💰 Cost Monitoring

Both services offer generous free tiers:

- **Railway:** 500 hours/month, 1GB RAM, 1GB storage
- **Vercel:** 100GB bandwidth/month, unlimited static sites

Monitor your usage to stay within free limits.

---

## 🎉 You're Done!

Your internship tracking system is now live and accessible worldwide!

**Frontend URL:** https://your-app-name.vercel.app
**Backend URL:** https://your-app-name.railway.app

Share the frontend URL with your users to start tracking internships!
