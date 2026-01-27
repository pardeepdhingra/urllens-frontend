# URL Lens - Deployment Guide

This guide covers deploying URL Lens to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Vercel (Recommended)](#vercel-recommended)
- [Railway](#railway)
- [Render](#render)
- [Docker](#docker)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, you need:

1. **Supabase Project** - [Create one here](https://supabase.com/dashboard)
2. **Git repository** - Push your code to GitHub, GitLab, or Bitbucket
3. **Node.js 18+** installed locally (for testing)

---

## Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/url-lens)

### Option 2: Manual Deploy

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

4. **Set Environment Variables:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project → Settings → Environment Variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Vercel Configuration

The `vercel.json` file is already configured with:
- 60-second timeout for API routes (needed for visual analysis)
- Playwright browser installation
- CORS headers for API routes

---

## Railway

[Railway](https://railway.app) offers a generous free tier with easy deployment.

### Steps:

1. **Create Railway Account** at [railway.app](https://railway.app)

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Configure Settings:**
   - Go to your service → Settings
   - Set Root Directory: `frontend`
   - Set Build Command: `npm install && npx playwright install chromium --with-deps && npm run build`
   - Set Start Command: `npm start`

4. **Add Environment Variables:**
   - Go to Variables tab
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
     NODE_ENV=production
     ```

5. **Deploy:**
   - Railway will automatically deploy when you push to your repository

### Railway Template

Create a `railway.json` in the frontend directory:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Render

[Render](https://render.com) provides free hosting with automatic SSL.

### Steps:

1. **Create Render Account** at [render.com](https://render.com)

2. **Create New Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure:**
   - **Name:** url-lens
   - **Root Directory:** frontend
   - **Environment:** Node
   - **Build Command:** `npm install && npx playwright install chromium --with-deps && npm run build`
   - **Start Command:** `npm start`

4. **Add Environment Variables:**
   - Scroll to "Environment Variables"
   - Add your Supabase credentials

5. **Create Web Service**

### Render Blueprint

Create a `render.yaml` in the root directory:
```yaml
services:
  - type: web
    name: url-lens
    env: node
    rootDir: frontend
    buildCommand: npm install && npx playwright install chromium --with-deps && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false
```

---

## Docker

For self-hosting or custom deployments.

### Dockerfile

Create `frontend/Dockerfile`:
```dockerfile
FROM node:20-slim

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install Playwright browsers
RUN npx playwright install chromium

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  url-lens:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    restart: unless-stopped
```

### Build and Run:
```bash
docker-compose up -d
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon/public key |
| `NEXT_PUBLIC_APP_URL` | No | Your app's public URL (for share links) |
| `NODE_ENV` | No | Set to `production` for deployments |
| `DISABLE_VISUAL_ANALYSIS` | No | Set to `true` to disable Playwright features |

---

## Supabase Setup

### 1. Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization, name, password, and region
4. Wait for project to be ready

### 2. Run Database Setup

1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `scripts/setup-database.sql`
3. Run the script

### 3. Configure Authentication

1. Go to Authentication → URL Configuration
2. Set **Site URL** to your deployed app URL
3. Add your app URL to **Redirect URLs**

### 4. Get API Keys

1. Go to Settings → API
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Troubleshooting

### Visual Analysis Not Working

**Problem:** Screenshots aren't captured.

**Solutions:**
1. Ensure Playwright is installed:
   ```bash
   npx playwright install chromium --with-deps
   ```
2. On serverless platforms, increase function timeout to 60s
3. Set `DISABLE_VISUAL_ANALYSIS=true` if Playwright can't run

### Build Fails on Vercel

**Problem:** Build fails with Playwright errors.

**Solution:** Add to `vercel.json`:
```json
{
  "installCommand": "npm install && npx playwright install chromium --with-deps"
}
```

### Database Connection Issues

**Problem:** Can't connect to Supabase.

**Solutions:**
1. Verify environment variables are set correctly
2. Check if your IP is allowed in Supabase settings
3. Ensure RLS policies are configured

### CORS Errors

**Problem:** API requests blocked by CORS.

**Solution:** The `vercel.json` includes CORS headers. For other platforms, configure your server to send:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
```

---

## Support

- **Issues:** Open an issue on GitHub
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)
