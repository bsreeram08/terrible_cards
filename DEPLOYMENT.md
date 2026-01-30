# Quick Deployment Guide

## Your app is built and ready to deploy! 🎉

Build output is in `.output/` directory:
- `.output/public/` - Static assets for Firebase Hosting
- `.output/server/` - Cloud Functions Gen 2 server

---

## Step 1: Login to Firebase

```bash
firebase login
```

This will open a browser for authentication.

---

## Step 2: Link to Your Project

You already have the project "ses-game". Link it:

```bash
firebase use ses-game
```

Or create `.firebaserc` manually:

```json
{
  "projects": {
    "default": "ses-game"
  }
}
```

---

## Step 3: Update firebase.json

Your current `firebase.json` uses `frameworksBackend` which is the old way. 

Update it to:

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
    "cleanUrls": true,
    "rewrites": [
      {
        "source": "**",
        "function": {
          "functionId": "server",
          "region": "us-central1",
          "pinTag": false
        }
      }
    ]
  },
  "functions": [
    {
      "source": ".output/server",
      "codebase": "default",
      "runtime": "nodejs20"
    }
  ],
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

---

## Step 4: Deploy

```bash
firebase deploy
```

Or deploy only hosting + functions:

```bash
firebase deploy --only hosting,functions
```

---

## Alternative: Use Firebase Hosting with Auto-detection

Firebase can auto-detect your framework. Try:

```bash
firebase init hosting
# Select: Use an existing project
# Select: ses-game
# Public directory: .output/public
# Configure as SPA: No
# Set up automatic builds: Yes (optional)

firebase deploy --only hosting
```

Firebase will automatically create the Cloud Function for SSR!

---

## Quick Commands Reference

```bash
# Login
firebase login

# Link project
firebase use ses-game

# Deploy everything
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy with preview first
firebase hosting:channel:deploy preview

# View logs
firebase functions:log

# Check deployment
firebase hosting:sites:list
```

---

## After Deployment

Your app will be live at:
- `https://ses-game.web.app`
- `https://ses-game.firebaseapp.com`

You can add a custom domain in:
Firebase Console → Hosting → Add custom domain

---

## Troubleshooting

If you get authentication errors:
```bash
firebase login --reauth
```

If deployment fails:
```bash
# Check logs
firebase functions:log --only server

# Try deploying in steps
firebase deploy --only firestore:rules
firebase deploy --only hosting
firebase deploy --only functions
```

---

**Ready to deploy! Run:**

```bash
firebase login
firebase use ses-game  
firebase deploy
```
