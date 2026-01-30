# Vercel Deployment Guide - Terrible Cards (SolidStart SSR)

## Why Vercel Instead of Firebase?

SolidStart with SSR requires a Node.js serverless environment. Firebase Hosting is primarily for static sites, while Vercel has first-class support for SolidStart's Nitro server.

**Benefits of Vercel**:
- ✅ Zero-config SolidStart support
- ✅ Automatic serverless functions
- ✅ Edge network (fast globally)
- ✅ Free SSL certificates
- ✅ Preview deployments for branches
- ✅ Free tier: 100GB bandwidth, unlimited sites

---

## Option 1: Deploy via Vercel CLI (Recommended)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
# or with bun
bun add -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This opens a browser to authenticate with GitHub, GitLab, or email.

### Step 3: Deploy

```bash
# From project root
cd /Users/sreeram/workspace/Sreeram/projects/samudhayam_ethirkum_attai

# Deploy (production)
vercel --prod
```

**First deployment prompts**:
```
? Set up and deploy "~/projects/samudhayam_ethirkum_attai"? [Y/n] y
? Which scope do you want to deploy to? Your Name
? Link to existing project? [y/N] n
? What's your project's name? terrible-cards
? In which directory is your code located? ./
```

Vercel auto-detects:
- Framework: SolidStart
- Build Command: `vinxi build`
- Output Directory: `.vercel/output`
- Install Command: `bun install`

### Step 4: Set Environment Variables

```bash
# Set Firebase config
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
```

Or use the Vercel dashboard:
1. Go to project settings → Environment Variables
2. Add each `VITE_*` variable
3. Redeploy: `vercel --prod`

### Step 5: Access Your App

After deployment:
```
✔ Production: https://terrible-cards.vercel.app
```

---

## Option 2: Deploy via GitHub Integration (Best for CI/CD)

### Step 1: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/terrible-cards.git
git push -u origin main
```

### Step 2: Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import from GitHub
4. Select your repository
5. Vercel auto-detects SolidStart settings
6. Add environment variables in dashboard
7. Click "Deploy"

**Automatic deployments**:
- `main` branch → Production
- Other branches → Preview deployments
- Pull requests → Preview URLs

---

## Option 3: One-Command Deploy (Using Script)

I'll create a deployment script for you:

```bash
# Quick deploy
bun run deploy

# Preview deploy
bun run deploy:preview
```

---

## Environment Variables Setup

Create `.env.production` (add to `.gitignore`):

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**For Vercel CLI**:
```bash
# Pull env vars from Vercel to local
vercel env pull

# This creates .env.local with production values
```

---

## Custom Domain Setup

### Step 1: Add Domain in Vercel

```bash
vercel domains add yourdomain.com
```

Or in dashboard: Project Settings → Domains → Add

### Step 2: Configure DNS

Add DNS records:

**Option A: Vercel DNS (recommended)**
- Transfer nameservers to Vercel

**Option B: Keep existing DNS**
- Add A record: `76.76.21.21`
- Add CNAME: `cname.vercel-dns.com`

### Step 3: SSL (automatic)

Vercel provisions SSL certificates automatically via Let's Encrypt.

---

## Build Configuration

Your `app.config.ts` is already configured correctly:

```typescript
export default defineConfig({
  server: {
    preset: "vercel"  // ✅ Already set
  }
});
```

**No changes needed!**

---

## Deployment Script

Let's create a simple deployment script:

```bash
#!/bin/bash
# scripts/deploy-vercel.sh

echo "🚀 Deploying to Vercel..."

# Clean previous builds
rm -rf .vercel .vinxi

# Build
echo "📦 Building..."
bun run build

# Deploy
echo "🌐 Deploying..."
vercel --prod

echo "✅ Deployment complete!"
```

Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "vercel --prod",
    "deploy:preview": "vercel"
  }
}
```

---

## Cost Comparison

### Vercel Free Tier:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions (100 GB-hours)
- ✅ Automatic SSL
- ✅ Preview deployments
- ✅ Analytics (basic)

**Estimated costs** for 1000 concurrent users:
- First 3 months: **$0** (free tier)
- After: ~$20/month (Pro plan if needed)

### Firebase (for comparison):
- SSR requires Cloud Functions ($$$)
- Complex setup with Nitro
- Not recommended for SolidStart

---

## Monitoring & Analytics

### Built-in Vercel Analytics

Free tier includes:
- Page views
- Unique visitors
- Top pages
- Referrers

Enable in dashboard: Project → Analytics

### Performance Monitoring

```bash
# Install Vercel Speed Insights
bun add @vercel/speed-insights
```

```typescript
// In src/app.tsx
import { injectSpeedInsights } from '@vercel/speed-insights/solidstart';

export default function App() {
  injectSpeedInsights();
  return <Router>...</Router>;
}
```

---

## Troubleshooting

### Build fails on Vercel

Check build logs in dashboard. Common issues:

**Missing dependencies**:
```bash
# Ensure all deps are in package.json, not devDependencies
bun add some-package
```

**Environment variables missing**:
```bash
vercel env ls  # List all env vars
vercel env add MISSING_VAR  # Add missing var
```

**Build timeout**:
- Upgrade to Pro plan (longer timeout)
- Or optimize build (remove unused deps)

### Functions not working

Vercel automatically creates serverless functions for API routes. Ensure:
- API routes are in `src/routes/api/`
- Functions return proper Response objects

### Preview deployments not working

```bash
# Deploy preview manually
vercel

# Or via GitHub PR (automatic)
```

---

## CI/CD Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Build
        run: bun run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: ${{ github.ref == 'refs/heads/main' }}
```

Get tokens from:
- `VERCEL_TOKEN`: Account Settings → Tokens
- `VERCEL_ORG_ID` & `VERCEL_PROJECT_ID`: `.vercel/project.json` after first deploy

---

## Next Steps

1. **Deploy now**:
   ```bash
   vercel --prod
   ```

2. **Add custom domain** (optional)

3. **Setup monitoring** (Vercel Analytics)

4. **Connect GitHub** for automatic deployments

5. **Start building features** from the roadmap!

---

## Quick Reference

```bash
# Login
vercel login

# Deploy production
vercel --prod

# Deploy preview
vercel

# Add env var
vercel env add VAR_NAME

# Pull env vars locally
vercel env pull

# View logs
vercel logs

# Remove project
vercel remove PROJECT_NAME
```

---

## Firebase Usage

You're still using Firebase for:
- ✅ **Firestore** (database)
- ✅ **Firebase Auth** (authentication)
- ✅ **Firebase Storage** (if needed)

Vercel handles:
- ✅ **Hosting** (web server)
- ✅ **SSR** (serverless functions)
- ✅ **Edge caching**

**Best of both worlds**: Firebase backend + Vercel frontend!
