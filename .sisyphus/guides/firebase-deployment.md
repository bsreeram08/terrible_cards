# Firebase Deployment Guide - Terrible Cards

## Prerequisites

1. **Firebase CLI installed**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project exists**: You should already have a Firebase project (check `firebase.json`)

3. **Environment variables set**: Your `.env` file should have Firebase config

---

## Step 1: Login to Firebase

```bash
firebase login
```

This will open a browser for Google authentication. Login with the Google account that owns your Firebase project.

---

## Step 2: Initialize Firebase Hosting (if not done)

Your `firebase.json` already has hosting configured, but let's verify the project association:

```bash
firebase use --add
```

Select your Firebase project from the list. This creates `.firebaserc` file.

Example `.firebaserc`:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

---

## Step 3: Build the Application

SolidStart uses Vinxi for building. Run:

```bash
bun run build
```

This creates:
- `.vinxi/build/` - Server and client bundles
- `.output/` - Nitro server output (for Vercel/Firebase)

---

## Step 4: Configure Firebase Hosting for SolidStart

Your current `firebase.json` is configured for frameworksBackend. Let's optimize it:

### Option A: Automatic Framework Detection (Recommended)

Firebase CLI can auto-detect SolidStart. Update `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": ".output/public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "function": "server"
      }
    ]
  },
  "functions": {
    "source": ".output/server"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true
    },
    "singleProjectMode": true
  }
}
```

### Option B: Static + Function (Hybrid)

If you want static assets + serverless:

```json
{
  "hosting": {
    "public": ".output/public",
    "cleanUrls": true,
    "rewrites": [
      {
        "source": "**",
        "function": "ssrServer"
      }
    ]
  },
  "functions": {
    "source": ".output/server",
    "runtime": "nodejs20"
  }
}
```

---

## Step 5: Deploy Firestore Rules & Indexes

Before deploying the app, deploy database rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

Verify rules are correct:
```bash
firebase firestore:rules:list
```

---

## Step 6: Deploy to Firebase Hosting

### Full Deployment

```bash
firebase deploy
```

This deploys:
- Hosting (static assets + server)
- Firestore rules
- Firestore indexes

### Hosting Only

If you only want to update the app (not database):

```bash
firebase deploy --only hosting
```

---

## Step 7: Set Environment Variables

Firebase Functions need environment variables. Set them:

```bash
# Set Firebase config (if needed by server)
firebase functions:config:set \
  firebase.api_key="YOUR_API_KEY" \
  firebase.auth_domain="YOUR_AUTH_DOMAIN" \
  firebase.project_id="YOUR_PROJECT_ID"
```

For SolidStart with Nitro, you might need a `.env.production`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Step 8: Verify Deployment

After deployment succeeds, you'll see:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT/overview
Hosting URL: https://YOUR_PROJECT.web.app
```

Visit the Hosting URL to verify your app works.

---

## Alternative: Deploy to Vercel (Faster)

Since you're using Nitro (from Vinxi), Vercel deployment is simpler:

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
vercel
```

Follow prompts:
- Link to existing project? **No**
- Project name? **terrible-cards**
- Directory? **./** (current)

### 4. Production Deploy

```bash
vercel --prod
```

Vercel automatically:
- Detects SolidStart
- Configures build command
- Sets up serverless functions
- Provides SSL certificate

---

## CI/CD Setup (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Build
        run: bun run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
          channelId: live
```

**Setup secrets** in GitHub repo settings:
- Go to Settings → Secrets → Actions
- Add each `VITE_*` variable
- Add `FIREBASE_SERVICE_ACCOUNT` (get from Firebase Console → Project Settings → Service Accounts)

---

## Troubleshooting

### Build fails with "Module not found"

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb .vinxi
bun install
bun run build
```

### Firebase deploy fails with "No targets found"

Check `.firebaserc` exists and has correct project ID:

```bash
firebase use --add
```

### Functions timeout or crash

Increase function memory in `firebase.json`:

```json
{
  "functions": {
    "source": ".output/server",
    "runtime": "nodejs20",
    "memory": "512MB",
    "timeout": "60s"
  }
}
```

### CORS errors in production

Update Firestore rules to allow your domain:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Your rules here
  }
}
```

---

## Performance Optimization

### 1. Enable Caching

Add to `firebase.json`:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

### 2. Enable Compression

Firebase automatically gzips, but you can optimize builds:

```bash
# In package.json
"build": "vinxi build --minify"
```

### 3. Prerender Static Pages

For landing page:

```typescript
// In app.config.ts
export default defineConfig({
  solidOptions: {
    ssr: true,
  },
  server: {
    prerender: {
      routes: ['/'],
      crawlLinks: true,
    },
  },
});
```

---

## Monitoring

### 1. Firebase Analytics

Already configured if you have `VITE_FIREBASE_APP_ID`. View in:
- Firebase Console → Analytics

### 2. Performance Monitoring

Add Firebase Performance:

```bash
firebase init performance
```

### 3. Error Tracking

Use Firebase Crashlytics or Sentry:

```bash
bun add @sentry/solidstart
```

---

## Cost Estimates (Firebase Free Tier)

| Service | Free Tier | Expected Usage | Cost |
|---------|-----------|----------------|------|
| Hosting | 10 GB/month | ~2 GB | Free |
| Firestore Reads | 50k/day | ~10k/day | Free |
| Firestore Writes | 20k/day | ~2k/day | Free |
| Auth | Unlimited | N/A | Free |
| Functions | 2M invocations | ~100k | Free |

For 1000 concurrent users, you'll likely stay in free tier for 1-2 months.

---

## Next Steps

1. ✅ **Deploy now**: Follow Step 1-8 above
2. Setup custom domain (Firebase Console → Hosting → Add custom domain)
3. Enable Firebase Analytics
4. Setup CI/CD with GitHub Actions
5. Monitor performance and costs

**Deployment command shortcut**:
```bash
bun run build && firebase deploy
```

Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "vinxi build && firebase deploy --only hosting"
  }
}
```

Then just run:
```bash
bun run deploy
```
