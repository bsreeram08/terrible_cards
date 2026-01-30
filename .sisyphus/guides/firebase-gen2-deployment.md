# Firebase Hosting + Cloud Functions Gen 2 Deployment (SolidStart SSR)

## Overview

**What's changing**:
- ❌ Cloud Functions Gen 1 (deprecated Feb 2025)
- ✅ Cloud Functions Gen 2 (built on Cloud Run - official replacement)

**Good news**: Firebase isn't going away! Gen 2 is actually better:
- ✅ Longer timeouts (up to 60 minutes vs 9 minutes)
- ✅ Larger instances (up to 32GB RAM vs 8GB)
- ✅ Concurrent requests (reduces cold starts)
- ✅ Built on Cloud Run (containerized, portable)

---

## Deployment Strategy for SolidStart SSR

Since SolidStart with SSR needs a Node.js runtime, we'll use:
- **Firebase Hosting**: Static assets (client bundle)
- **Cloud Functions Gen 2**: SSR server
- **Firestore**: Database (already configured)

---

## Step 1: Update to Cloud Functions Gen 2 Preset

Change your `app.config.ts`:

```typescript
import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    preset: "firebase"  // Change from "vercel"
  }
});
```

---

## Step 2: Install Firebase Tools

```bash
npm install -g firebase-tools
```

Login:
```bash
firebase login
```

---

## Step 3: Initialize Firebase Hosting + Functions

```bash
firebase init hosting
firebase init functions
```

**Prompts**:
- Use existing project? **Yes** (select ses-game)
- Public directory? **`.output/public`**
- Single-page app? **No**
- Setup automatic builds? **No**
- Functions language? **JavaScript**
- ESLint? **No**
- Install dependencies? **Yes**

This creates:
- `firebase.json` (updated)
- `functions/` directory

---

## Step 4: Configure firebase.json for Gen 2

Update your `firebase.json`:

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
        "function": {
          "functionId": "ssrServer",
          "region": "us-central1"
        }
      }
    ]
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "runtime": "nodejs20",
      "gen": 2
    }
  ]
}
```

Key changes:
- `"gen": 2` - Use Cloud Functions Gen 2
- `runtime: "nodejs20"` - Latest Node.js
- Rewrite rules point to Gen 2 function

---

## Step 5: Create Cloud Function Gen 2 for SSR

Create `functions/index.js`:

```javascript
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

// Set global options for Gen 2
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 60,
  concurrency: 80  // Handle multiple requests per instance
});

// Import your SSR server
const handler = require("../.output/server/index.mjs");

// Export as Cloud Function Gen 2
exports.ssrServer = onRequest({
  cors: true,
  invoker: "public"  // Allow public access
}, handler);
```

**Note**: For ES Modules (`.mjs`), you need to use dynamic import:

```javascript
const { onRequest } = require("firebase-functions/v2/https");

exports.ssrServer = onRequest(async (req, res) => {
  const { default: handler } = await import("../.output/server/index.mjs");
  return handler(req, res);
});
```

---

## Step 6: Build Your App

```bash
bun run build
```

This creates:
- `.output/public/` - Static assets
- `.output/server/` - SSR server

---

## Step 7: Copy Server to Functions

```bash
# Copy server files to functions directory
cp -r .output/server functions/server

# Or create a build script
```

Add to `package.json`:

```json
{
  "scripts": {
    "build:firebase": "vinxi build && cp -r .output/server functions/server",
    "deploy": "npm run build:firebase && firebase deploy"
  }
}
```

---

## Step 8: Deploy

```bash
firebase deploy
```

Or deploy only hosting + functions:

```bash
firebase deploy --only hosting,functions
```

---

## Alternative: Use Nitro's Firebase Preset Directly

Nitro (the build system behind SolidStart) has a Firebase preset that handles Gen 2 automatically.

### Update app.config.ts

```typescript
export default defineConfig({
  server: {
    preset: "firebase",
    firebase: {
      gen: 2,  // Use Gen 2
      nodeVersion: "20",
      region: "us-central1",
      serverFunctionName: "ssrServer"
    }
  }
});
```

### Build

```bash
bun run build
```

This creates `.output/server/` with a Firebase Gen 2 function ready to deploy.

### Deploy

```bash
firebase deploy --only hosting,functions
```

---

## Environment Variables

Set environment variables for Cloud Functions:

```bash
firebase functions:config:set \
  firebase.api_key="YOUR_API_KEY" \
  firebase.project_id="ses-game"
```

Or use `.env` files (recommended for Gen 2):

Create `functions/.env`:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=ses-game
```

---

## Cost Comparison: Gen 2 vs Alternatives

### Cloud Functions Gen 2 (Firebase)

**Free Tier**:
- 2M invocations/month
- 400,000 GB-seconds compute
- 200,000 GHz-seconds compute
- 5GB network egress

**Pricing** (after free tier):
- $0.40 per million invocations
- $0.0000025 per GB-second
- $0.10 per GB network egress

**For 1000 concurrent users**:
- ~100k requests/day = 3M/month
- Cost: ~$0.40/month (essentially free)

### Cloudflare Workers (Alternative)

**Free Tier**:
- 100k requests/day
- 10ms CPU time per request

**Pricing**:
- $5/month for unlimited

---

## Recommended Architecture

**Best setup for your app**:

```
┌─────────────────────────────────────┐
│     Firebase Hosting (CDN)          │
│  - Static assets (.output/public)   │
│  - Global edge network               │
└──────────────┬──────────────────────┘
               │
               │ Rewrite /** to function
               │
┌──────────────▼──────────────────────┐
│  Cloud Functions Gen 2 (SSR)        │
│  - SolidStart server                │
│  - Node.js 20 runtime                │
│  - Up to 80 concurrent requests      │
└──────────────┬──────────────────────┘
               │
               │ Firebase SDK
               │
┌──────────────▼──────────────────────┐
│      Firestore (Database)            │
│  - Real-time multiplayer data        │
│  - Already configured                │
└─────────────────────────────────────┘
```

---

## Troubleshooting

### Build fails with "Module not found"

Ensure all dependencies are in `functions/package.json`:

```bash
cd functions
npm install vinxi @solidjs/start
```

### Function timeout

Increase timeout in `firebase.json`:

```json
{
  "functions": [{
    "gen": 2,
    "timeoutSeconds": 120
  }]
}
```

### Cold starts

Gen 2 reduces cold starts with concurrency. To eliminate completely:

```json
{
  "functions": [{
    "gen": 2,
    "minInstances": 1  // Always warm (costs ~$6/month)
  }]
}
```

---

## Migration from Vercel Preset

Change 3 things:

1. **app.config.ts**:
```typescript
preset: "firebase"  // was "vercel"
```

2. **Build output**: Same (`.output/`)

3. **Deploy command**:
```bash
firebase deploy  // was "vercel"
```

---

## Next Steps

1. **Update app.config.ts** to Firebase preset
2. **Build**: `bun run build`
3. **Deploy**: `firebase deploy`
4. **Monitor**: Firebase Console → Functions

Want me to make these changes and deploy for you?
