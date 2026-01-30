# SES Game Complete Rewrite: SolidStart + Firebase + GSAP

## TL;DR

> **Quick Summary**: Complete rewrite of the SES (Samudhayam Ethirkum Attai) card game from broken Next.js to SolidStart with impressive 3D card animations using GSAP + CSS 3D transforms. Firebase retained for backend.
>
> **Deliverables**:
> - Fresh SolidStart project with Bun runtime
> - 3D animated card system (flip, deal, shuffle, shake, drag, particles)
> - Real-time multiplayer CAH-style gameplay
> - Authentication (email, Google, anonymous)
> - AGENTS.md for new stack
> - TDD test coverage
>
> **Estimated Effort**: Large (5 weeks)
> **Parallel Execution**: YES - 6 waves
> **Critical Path**: Project Setup → Card System → Game Core → Polish

---

## Context

### Original Request
User requested:
1. Create AGENTS.md with build/lint/test commands and code style guidelines
2. Architect for 1M+ users (enterprise-grade, professional)
3. Move away from Next.js to lighter framework
4. Make cards look good in 3D with animations

User then clarified the current codebase is completely broken (game logic, runtime crashes, Firebase sync issues) and wants to delete everything and start fresh.

### Interview Summary
**Key Decisions**:
- **Framework**: SolidStart (15-40KB bundles vs 150KB+ Next.js)
- **Animation**: CSS 3D + GSAP (~28KB) - all 6 animations are MVP must-haves
- **Backend**: Firebase (pricing flexibility, no server management)
- **Runtime**: Bun (3x faster than Node.js)
- **Testing**: TDD from beginning with Vitest
- **Approach**: Delete everything, fresh start

**Animation Requirements (All MVP)**:
1. Card flip (3D rotation)
2. Dealing sequence (staggered from deck)
3. Shuffle effect (physics-based)
4. Hover shake (wiggle emphasis)
5. Drag to play (GSAP Draggable)
6. Particle effects (celebrations)

### Self-Review Gap Analysis

**Guardrails Applied**:
- No scope creep to premium features
- No sound effects in MVP (nice-to-have, not blocking)
- No custom deck creation in MVP
- Particles via canvas-confetti (3KB) not tsParticles (15KB) - lighter

**Assumptions Validated**:
- solid-firebase library works with SolidStart
- GSAP works with SolidJS (confirmed - no bindings needed)
- Existing Firebase project can be reused (just need env vars)

**Edge Cases Addressed**:
- Reconnection handling (Firestore offline persistence)
- Turn timeout (auto-skip after 90s)
- Player disconnect (mark as offline, allow rejoin)

---

## Repo Layout Strategy

### What Gets Deleted vs Preserved

**PRESERVE (do not delete)**:
```
.git/                       # Git history
.env.local                  # Firebase credentials (NEXT_PUBLIC_FIREBASE_*)
firebase.json               # Firebase project config
firestore.rules             # Firestore security rules
firestore.indexes.json      # Firestore indexes
data/india.json             # Card deck JSON (black/white cards)
```

**DELETE (entire directories)**:
```
app/                        # Next.js app router
components/                 # React components
lib/                        # Next.js libraries
hooks/                      # React hooks
context/                    # React context
types/                      # Will recreate for Solid
.next/                      # Next.js build cache
node_modules/               # Reinstall for new deps
package.json                # Replace with SolidStart
tsconfig.json               # Replace with SolidStart
next.config.ts              # Next.js specific
tailwind.config.js          # Recreate for Solid
postcss.config.mjs          # Recreate
eslint.config.mjs           # Recreate
components.json             # shadcn/ui (React-specific)
memory-bank/                # Old project docs
.windsurf/                  # Old agent rules
```

**AFTER DELETION**: Create new SolidStart project at repo root (not in subdirectory).

### Final Project Structure

```
/                              # Repo root = SolidStart project
├── src/
│   ├── routes/               # SolidStart file-based routing
│   ├── components/           # Solid components
│   ├── lib/                  # Utilities and Firebase
│   └── types/                # TypeScript types
├── public/                   # Static assets
├── data/
│   └── india.json            # PRESERVED: Card deck (blackCards/whiteCards)
├── firebase.json             # PRESERVED
├── firestore.rules           # PRESERVED
├── firestore.indexes.json    # PRESERVED
├── .env.local                # PRESERVED (migrated vars)
├── .env.example              # NEW: Safe template
├── app.config.ts             # NEW: SolidStart config
├── package.json              # NEW: SolidStart deps
├── AGENTS.md                 # NEW: AI coding guidelines
└── vitest.config.ts          # NEW: Test config
```

---

## Environment Variable Strategy

### Current Variables (from existing .env.local)

The existing Next.js app uses `NEXT_PUBLIC_*` prefix. SolidStart/Vite uses `VITE_*` prefix.

**The existing `.env.local` also contains Firebase Admin SDK secrets** (private keys, service account). These are for server-side operations and are NOT needed for the client-side SolidStart app.

### What Goes Where

**CLIENT-SIDE ONLY (new SolidStart app)** - `.env.local`:
```bash
# Public Firebase config (safe for client)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

**ADMIN/SERVER SECRETS (NOT migrated to new app)**:
```bash
# These exist in old .env.local but are NOT used in new SolidStart app
# FIREBASE_ADMIN_* / FIREBASE_PRIVATE_KEY / service account paths
# Leave in backup file, do NOT copy to new .env.local
# Do NOT include in .env.example
```

### .env.example (Committed to Git - Safe Template)
```bash
# Firebase Client Config (safe to expose)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXX

# NOTE: Admin SDK secrets are NOT used in this app.
# If server-side Firebase Admin is needed later, add:
# FIREBASE_ADMIN_* vars (and ensure they're git-ignored)
```

### Migration Procedure (Task 1 - Exact Steps)

```bash
# Step 1: Copy existing .env.local to backup (preserve all secrets)
cp .env.local .env.local.backup

# Step 2: Extract ONLY client config values (NEXT_PUBLIC_FIREBASE_*)
# Transform to VITE_* prefix
# Write ONLY these to new .env.local
# DO NOT copy FIREBASE_ADMIN_* or private key vars

# Step 3: Create .env.example with placeholders (no real values)

# Step 4: Verify .env.local is in .gitignore (already covered - .gitignore has .env*)
# NOTE: .gitignore already contains ".env*" pattern, so .env.local is covered.
# No action needed here - just verification.
cat .gitignore | grep -E "^\.env"
# Expected output: .env* or .env.local

# Step 5: Keep .env.local.backup for reference (git-ignored)
# If admin secrets were ever committed, rotate keys in Firebase Console
```

**Security Verification Step**: After migration, run:
```bash
git status
# Verify: .env.local is NOT listed (should be gitignored)
# Verify: .env.example IS listed (safe to commit)
```

**Firebase Admin Note**: The new SolidStart app is client-only. Firebase Admin SDK is NOT used. All game logic uses client-side Firestore with security rules. If server-side admin operations are needed later, they would be added via SolidStart API routes with separate server-only env vars.

**Access in code**: `import.meta.env.VITE_FIREBASE_*`

---

## SolidStart SSR/Client Boundaries (CRITICAL)

### The Problem
SolidStart routes can run during SSR (server-side rendering). Firebase Web SDK and GSAP require browser APIs (`window`, DOM). Importing them in SSR context causes "window is not defined" errors.

### The Solution: Client-Only Modules

**CHOSEN APPROACH**: `clientOnly()` wrapper from `@solidjs/start` + dynamic imports.

SolidStart does NOT support `export const route = { ssr: false }` on individual routes.
Instead, use these documented mechanisms:

1. **`clientOnly()` wrapper** - Wrap components that need browser APIs
2. **Global `ssr: false`** - In `app.config.ts` to disable SSR entirely (not recommended for SEO)
3. **Dynamic imports inside `onMount`** - For SSR-enabled routes needing client APIs on interaction

**The `clientOnly()` Pattern** (RECOMMENDED for game routes):
```typescript
// src/routes/(game)/[roomId].tsx
import { clientOnly } from '@solidjs/start';

// This component will ONLY render on the client
const GameRoom = clientOnly(() => import('~/components/game/GameRoom'));

export default function GamePage() {
  return <GameRoom />;
}
```

**What `clientOnly()` does**:
- Returns `null` during SSR
- Dynamically imports and renders the component only in the browser
- Prevents "window is not defined" errors
- No SSR for that component (fine for game UI)

**Firebase Initialization** (`src/lib/firebase/config.ts`):
```typescript
// This file MUST only be imported from:
// 1. Components wrapped with clientOnly(), OR
// 2. Inside onMount() callbacks (dynamic import)

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

// Singleton pattern - only initialize once
function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({...});
}

export const app = getFirebaseApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence (client-only)
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch(console.warn);
}
```

**Client-Only Import Pattern**:
```typescript
// In components that use Firebase/GSAP, use dynamic import or guard:
import { onMount, createSignal } from 'solid-js';

export function GameRoom() {
  const [gameState, setGameState] = createSignal(null);
  
  onMount(async () => {
    // Dynamically import client-only modules INSIDE onMount
    const { db } = await import('~/lib/firebase/config');
    const { useGameDoc } = await import('~/lib/firebase/firestore');
    // Now safe to use - we're in the browser
  });
}
```

**Alternative: Dedicated Client Entry Points**:
For components that are inherently client-only (game board, animations):
```typescript
// src/components/game/GameBoard.tsx
// Mark entire file as client-only by:
// 1. Only importing from routes that are client-rendered
// 2. Using isServer check at top level

import { isServer } from 'solid-js/web';
if (isServer) throw new Error('GameBoard is client-only');

// Now safe to import DOM-dependent libraries
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
```

### Route-Level Strategy

| Route | SSR Behavior | Client-Only Strategy |
|-------|--------------|---------------------|
| `/` (home) | SSR allowed | No Firebase needed |
| `/login` | SSR allowed | Firebase loaded via `onMount` dynamic import |
| `/game/[roomId]` | **Client-only** | Entire page wrapped with `clientOnly()` |
| `/game/[roomId]/play` | **Client-only** | Entire page wrapped with `clientOnly()` |

**How Each Route Handles Firebase**:

**Home page** (`/`): No Firebase imports.

**Login page** (`/login`): SSR-enabled, Firebase loaded on user interaction:
```typescript
// src/routes/(auth)/login.tsx
import { onMount, createSignal } from 'solid-js';

export default function LoginPage() {
  const [authLoaded, setAuthLoaded] = createSignal(false);
  
  onMount(async () => {
    // Dynamic import - only runs in browser
    const { auth } = await import('~/lib/firebase/config');
    setAuthLoaded(true);
  });
  
  const handleGuestLogin = async () => {
    const { auth } = await import('~/lib/firebase/config');
    const { signInAnonymously } = await import('firebase/auth');
    await signInAnonymously(auth);
  };
  
  return <div>...</div>;
}
```

**Game routes** (`/game/*`): Client-only via `clientOnly()` wrapper:
```typescript
// src/routes/(game)/[roomId].tsx
import { clientOnly } from '@solidjs/start';

const GameRoom = clientOnly(() => import('~/components/game/GameRoom'));

export default function GamePage() {
  return <GameRoom fallback={<div>Loading game...</div>} />;
}
```

### GSAP Integration (Client-Only)

GSAP and Draggable are purely client-side:
```typescript
// src/lib/animations/gsap.ts
// This file is ONLY imported from client-rendered components

import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';

// Register plugin once
gsap.registerPlugin(Draggable);

export { gsap, Draggable };
```

**Import pattern in components**:
```typescript
import { onMount, onCleanup } from 'solid-js';

export function Card(props) {
  let cardRef: HTMLDivElement;
  
  onMount(async () => {
    // Dynamic import ensures client-only
    const { gsap } = await import('~/lib/animations/gsap');
    const tl = gsap.timeline();
    // ... animations
    
    onCleanup(() => tl.kill());
  });
  
  return <div ref={cardRef!}>...</div>;
}
```

### Verification Checklist (Task 4 Acceptance)

```bash
# Agent runs during Task 4:
bun run build
# Expected: No "window is not defined" errors
# Expected: Build succeeds

# Then start dev server:
bun dev
# Navigate to /login, /game routes
# Expected: No SSR hydration errors in console
```

---

## Firestore Data Model (Explicit Schema)

### Collections and Documents

The new app will **conform to existing Firestore paths/permissions** in `firestore.rules`. Fields may be added without rules changes. No firestore.rules modifications in MVP.

```typescript
// Collection: /games/{gameId}
interface GameDocument {
  id: string;                    // Auto-generated Firestore doc ID
  hostId: string;                // User ID of game creator
  playerUids: string[];          // Array of player user IDs (order determines turn)
  status: 'waiting' | 'playing' | 'judging' | 'round_end' | 'finished';
  currentRound: number;          // 1-indexed round number
  currentJudgeIndex: number;     // Index into playerUids
  
  // GAME SETTINGS: Configurable at game creation
  settings: {
    winningScore: number;        // Default: 7 (points to win)
    turnTimeoutSeconds: number;  // Default: 90 (seconds per turn)
    cardsPerHand: number;        // Default: 7 (white cards in hand)
    deckId: string;              // Default: 'india' (which card deck to use)
  };
  
  // SCORES: Map of playerId -> score (number of rounds won)
  scores: {
    [playerId: string]: number;
  };
  
  // DECK STATE: Remaining cards for this game
  deck: {
    blackCardIds: string[];      // Shuffled, unplayed black card IDs
    whiteCardIds: string[];      // Shuffled, unplayed white card IDs
  };
  
  // PENDING DEALS: Cards waiting to be claimed by players (claim-based dealing)
  // Map of playerId -> array of card IDs they should claim
  // Populated by host at round start, cleared when player claims
  pendingDeals?: {
    [playerId: string]: string[];  // Card IDs for player to claim
  };
  
  // PENDING AUTO-SUBMIT: For turn timeout - cards to auto-submit on behalf of player
  // Populated by host when timeout expires, cleared when processed
  pendingAutoSubmit?: {
    [playerId: string]: string[];  // Card IDs to auto-submit for player
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection: /games/{gameId}/rounds/{roundId}
// roundId format: `round_${roundNumber}` (e.g., "round_1", "round_2")
interface RoundDocument {
  roundNumber: number;
  judgeId: string;               // User ID of judge
  blackCard: {
    id: string;
    text: string;
    pick: number;                // How many white cards to play
  };
  submissions: {
    [playerId: string]: {
      cards: WhiteCard[];
      submittedAt: Timestamp;
    };
  };
  winnerId: string | null;
  winningCards: WhiteCard[] | null;
  status: 'submitting' | 'judging' | 'complete';
  startedAt: Timestamp;
  completedAt: Timestamp | null;
}

// Collection: /games/{gameId}/playerHands/{playerId}
interface PlayerHandDocument {
  cards: WhiteCard[];            // Player's current hand (7-10 cards)
  lastUpdated: Timestamp;
}

// Collection: /inviteCodes/{code}
interface InviteCodeDocument {
  gameId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;          // 24 hours from creation
}

// Collection: /users/{userId}
interface UserDocument {
  displayName: string;           // "CleverMango123" for anonymous
  email: string | null;          // null for anonymous
  photoURL: string | null;
  isAnonymous: boolean;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

// Shared Types
interface BlackCard {
  id: string;                    // Generated: `black_${index}` from deck position
  text: string;
  pick: number;                  // 1, 2, or 3
}

interface WhiteCard {
  id: string;                    // Generated: `white_${index}` from deck position
  text: string;
}
```

### Card ID Generation Strategy

The source `/data/india.json` does NOT contain card IDs. IDs are generated deterministically at game creation:

```typescript
// At game creation, when loading deck:
function generateCardIds(deck: RawDeck): ProcessedDeck {
  return {
    blackCards: deck.blackCards.map((card, i) => ({
      id: `black_${i}`,  // Deterministic ID based on array index
      text: card.text,
      pick: card.pick
    })),
    whiteCards: deck.whiteCards.map((card, i) => ({
      id: `white_${i}`,  // Deterministic ID based on array index
      text: card.text
    }))
  };
}
```

This ensures:
- Consistent IDs across all clients
- No need to modify source JSON
- IDs are stable within a game session

### Deck Lifecycle (Multi-Round Support)

1. **Game Creation**: Load `/data/india.json`, generate IDs, shuffle, store full deck in `GameDocument.deck`
2. **Round Start**: 
   - Pop 1 black card from `deck.blackCardIds`
   - Deal cards to players (see "Write Strategy" below)
3. **Card Played**: Card moves from `playerHands` to `rounds/{roundId}/submissions` (no return to deck)
4. **Round End**: 
   - Winner's score incremented in `GameDocument.scores`
   - Replenish hands (see "Write Strategy" below)
5. **Deck Exhaustion**: If `whiteCardIds` runs low, reshuffle discarded cards (played cards from previous rounds). Track via `discardedWhiteCardIds` if needed.

### Firestore Path Decision (CANONICAL)

**There are TWO playerHands paths in existing rules. We will use:**

**CANONICAL PATH**: `/games/{gameId}/playerHands/{playerId}` (subcollection under games)

**NOT USED**: `/playerHands/{gameId}/{playerId}` (root collection - legacy, ignore)

**Rationale**: 
- Subcollection is co-located with game data (better for reads)
- Matches the existing rules structure for game-scoped data
- Easier security rules (game context is parent)

### Firestore Write Strategy (Under Current Rules - No Rules Changes)

**Problem**: Current rules only allow `playerId` to update their own hand. Host cannot directly update other players' hands.

**Solution**: "Claim-based" dealing with transaction

**Prerequisites - Hand Document Bootstrapping**:

Before dealing can work, each player needs a `playerHands/{playerId}` document to exist. Host creates these on game start (host can CREATE, players can UPDATE):

```typescript
// In startGame() function - host creates empty hand docs for all players
async function bootstrapPlayerHands(gameId: string, playerIds: string[]) {
  const batch = writeBatch(db);
  for (const playerId of playerIds) {
    const handRef = doc(db, 'games', gameId, 'playerHands', playerId);
    batch.set(handRef, {
      cards: [],
      lastUpdated: serverTimestamp()
    });
  }
  await batch.commit();
}
// This is allowed by rules: host can CREATE playerHands docs
```

**How Dealing Works:**

0. **On Game Start (prerequisite)**: Host calls `bootstrapPlayerHands()` to create empty hand docs for all players. This is the ONLY time host creates these docs.

1. **Host prepares round**: 
   - Pop N white cards per player from `GameDocument.deck.whiteCardIds`
   - Write to `GameDocument.pendingDeals[playerId]: string[]` (card IDs each player should claim)
   - Create the round document

2. **Each player claims their cards** (client-side, triggered by listener):
   ```typescript
   // When player sees pendingDeals[myUserId] exists:
   await runTransaction(db, async (tx) => {
     const gameDoc = await tx.get(gameRef);
     const myPendingCards = gameDoc.data().pendingDeals[myUserId];
     if (!myPendingCards) return; // Already claimed or not for me
     
     // Get full card objects from deck reference
     const cardObjects = myPendingCards.map(id => getCardById(id));
     
     // Update MY hand (allowed by rules: playerId == request.auth.uid)
     tx.update(handRef, { 
       cards: arrayUnion(...cardObjects),
       lastUpdated: serverTimestamp()
     });
     
     // Clear my pending deal (mark as claimed)
     tx.update(gameRef, {
       [`pendingDeals.${myUserId}`]: deleteField()
     });
   });
   ```

3. **Card submission** (player updates their own hand):
   ```typescript
   // Remove card from hand and add to round submissions
   await runTransaction(db, async (tx) => {
     // Read current hand
     const handDoc = await tx.get(handRef);
     const currentCards = handDoc.data().cards;
     const remainingCards = currentCards.filter(c => c.id !== submittedCardId);
     
     // Update hand (allowed: my own hand)
     tx.update(handRef, { cards: remainingCards });
     
     // Add to submissions
     tx.update(roundRef, {
       [`submissions.${myUserId}`]: {
         cards: [submittedCard],
         submittedAt: serverTimestamp()
       }
     });
   });
   ```

4. **Round end replenishment**: Same "claim-based" pattern - host sets `pendingDeals`, players claim.

**Why this works under current rules**:
- Players only update `playerHands/{playerId}` where `playerId == auth.uid` ✓
- Host updates `GameDocument.pendingDeals` (game doc update is allowed) ✓
- Transactions ensure atomicity and consistency ✓
- No rules changes needed ✓

### Turn Timeout Enforcement

**Mechanism**: Client-side timeout with server-state validation

1. **Turn start**: Round document sets `startedAt` timestamp
2. **Each client**: Runs local timer for `turnTimeoutSeconds` (90s default)
3. **Host client responsibility**: When timeout expires:
   - Check if submission still missing
   - Call `autoSubmitRandom(playerId)` function
   - This selects random cards from player's hand and submits ON BEHALF of player
   - Uses same claim-based pattern: host sets `pendingAutoSubmit[playerId]`, player's client auto-claims
4. **Conflict resolution**: If multiple clients try to auto-submit, Firestore transaction ensures only one succeeds (first-write-wins via timestamp check)
5. **Judging timeout**: Same mechanism - if judge doesn't pick in 90s, host client auto-selects random winner

**Why client-side**: Avoids Firebase Cloud Functions cost. Host client acts as "server" for timeout enforcement. If host disconnects, any other client can take over (first to submit wins).

### Firestore Sync Strategy

1. **Game state listener**: `onSnapshot` on `/games/{gameId}` for game-level changes (scores, status, deck state)
2. **Round listener**: `onSnapshot` on `/games/{gameId}/rounds/round_${currentRound}` for submission updates
3. **Hand listener**: `onSnapshot` on `/games/{gameId}/playerHands/{myUserId}` for card updates
4. **Offline persistence**: Enable Firestore offline mode for reconnection handling
5. **Transactions**: Use `runTransaction` for atomic operations (submitting cards, selecting winner, updating scores)

### Transaction/Atomicity Rules (CRITICAL for Consistency)

All state-changing operations that touch multiple documents or require conflict detection MUST use `runTransaction`. This section defines EXACTLY which operations require transactions and what checks are performed.

**Legend:**
- ✅ REQUIRED transaction
- 📝 Single-document write (no transaction needed)
- 🔒 Conflict check (read-before-write validation)

#### Host-Only Operations

| Operation | Transaction? | Conflict Check | Documents Modified |
|-----------|-------------|----------------|-------------------|
| **Create Game** | 📝 No | None | `games/{id}` (create) |
| **Start Game** | ✅ YES | `status == 'waiting'` | `games/{id}` (status→playing), `games/{id}/rounds/round_1` (create), `games/{id}/playerHands/{*}` (bootstrap) |
| **Start Round** | ✅ YES | `status == 'round_end' AND currentRound == expectedRound` | `games/{id}` (deck pop, pendingDeals, currentRound++), `games/{id}/rounds/round_N` (create) |
| **Select Winner** | ✅ YES | `round.status == 'judging' AND auth.uid == judgeId` | `games/{id}` (scores++), `rounds/{id}` (winnerId, status→complete) |
| **Next Round** | ✅ YES | `status == 'round_end'` | `games/{id}` (status, judgeIndex rotate, new pendingDeals) |

#### Player Operations

| Operation | Transaction? | Conflict Check | Documents Modified |
|-----------|-------------|----------------|-------------------|
| **Claim Cards** | ✅ YES | `pendingDeals[myId] exists` | `games/{id}` (clear pendingDeals[myId]), `playerHands/{myId}` (add cards) |
| **Submit Cards** | ✅ YES | `round.status == 'submitting' AND !submissions[myId]` | `playerHands/{myId}` (remove cards), `rounds/{id}` (add submission) |

#### Transaction Code Patterns

**Start Game Transaction** (host only):
```typescript
async function startGame(gameId: string) {
  await runTransaction(db, async (tx) => {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await tx.get(gameRef);
    
    // 🔒 Conflict check
    if (gameDoc.data().status !== 'waiting') {
      throw new Error('Game already started');
    }
    if (gameDoc.data().hostId !== auth.currentUser?.uid) {
      throw new Error('Only host can start game');
    }
    if (gameDoc.data().playerUids.length < 3) {
      throw new Error('Need at least 3 players');
    }
    
    // Bootstrap player hands
    const playerIds = gameDoc.data().playerUids;
    for (const playerId of playerIds) {
      const handRef = doc(db, 'games', gameId, 'playerHands', playerId);
      tx.set(handRef, { cards: [], lastUpdated: serverTimestamp() });
    }
    
    // Create round 1
    const roundRef = doc(db, 'games', gameId, 'rounds', 'round_1');
    const blackCard = popBlackCard(gameDoc.data().deck);
    tx.set(roundRef, {
      roundNumber: 1,
      judgeId: playerIds[0],
      blackCard,
      submissions: {},
      winnerId: null,
      status: 'submitting',
      startedAt: serverTimestamp()
    });
    
    // Prepare card deals
    const pendingDeals = prepareDeals(gameDoc.data().deck, playerIds, 7);
    
    // Update game
    tx.update(gameRef, {
      status: 'playing',
      currentRound: 1,
      currentJudgeIndex: 0,
      pendingDeals,
      'deck.whiteCardIds': arrayRemove(...Object.values(pendingDeals).flat()),
      updatedAt: serverTimestamp()
    });
  });
}
```

**Select Winner Transaction** (judge only):
```typescript
async function selectWinner(gameId: string, roundId: string, winnerId: string) {
  await runTransaction(db, async (tx) => {
    const gameRef = doc(db, 'games', gameId);
    const roundRef = doc(db, 'games', gameId, 'rounds', roundId);
    const [gameDoc, roundDoc] = await Promise.all([tx.get(gameRef), tx.get(roundRef)]);
    
    // 🔒 Conflict checks
    if (roundDoc.data().status !== 'judging') {
      throw new Error('Round not in judging phase');
    }
    if (roundDoc.data().judgeId !== auth.currentUser?.uid) {
      throw new Error('Only judge can select winner');
    }
    if (!roundDoc.data().submissions[winnerId]) {
      throw new Error('Winner did not submit');
    }
    
    // Update round
    tx.update(roundRef, {
      winnerId,
      winningCards: roundDoc.data().submissions[winnerId].cards,
      status: 'complete',
      completedAt: serverTimestamp()
    });
    
    // Update score
    const currentScore = gameDoc.data().scores[winnerId] || 0;
    tx.update(gameRef, {
      [`scores.${winnerId}`]: currentScore + 1,
      status: 'round_end',
      updatedAt: serverTimestamp()
    });
  });
}
```

### Security Enforcement Stance (MVP Reality)

**IMPORTANT: This section documents what is and is NOT enforced at the Firestore rules level.**

#### What Firestore Rules Enforce (server-side, trustworthy)

| Rule | Path | Actual Constraint (from firestore.rules) |
|------|------|------------------------------------------|
| ✅ Auth required | All paths | `request.auth != null` |
| ✅ Own hand UPDATE only | `/games/{gameId}/playerHands/{playerId}` | `update: auth.uid == playerId AND auth.uid in playerUids` |
| ✅ Host-only hand CREATE | `/games/{gameId}/playerHands/{playerId}` | `create: auth.uid == game.hostId` (NOT any authenticated user) |
| ✅ Host or owner can READ hand | `/games/{gameId}/playerHands/{playerId}` | `read: auth.uid == hostId OR auth.uid == playerId` |
| ✅ Any auth can update game | `/games/{gameId}` | `update: auth != null` (permissive for MVP) |
| ✅ Any auth can write rounds | `/games/{gameId}/rounds/{roundId}` | `write: auth != null` (permissive for MVP) |

#### What Is NOT Enforced by Rules (client-side only, trust-on-good-faith)

| Constraint | Enforcement | Risk Level |
|------------|-------------|------------|
| Only host can start game | UI check + in-app validation | LOW (malicious user could start, but game would break for them) |
| Only host can deal cards | UI check + transaction conflict check | LOW |
| Only judge can select winner | In-app validation in transaction | MEDIUM (cheater could try direct write) |
| Turn order enforcement | In-app logic | LOW |
| Card ownership validation | In-app validation | MEDIUM |

**Mitigation Strategy (MVP)**:
1. **Transaction conflict checks** catch most abuse (see Transaction Rules above)
2. **UI restrictions** prevent accidental misuse
3. **Game state machines** reject invalid transitions
4. **Logging** (optional) can detect suspicious patterns

**Post-MVP Security Hardening** (NOT in this plan):
- Cloud Functions for sensitive operations (select winner, deal cards)
- Custom claims for host role
- Stricter Firestore rules with request data validation

**Explicit Acknowledgment**:
> The current MVP accepts that a determined attacker with Firebase SDK knowledge could bypass UI restrictions and attempt direct Firestore writes. The transaction conflict checks provide reasonable protection for game integrity, but not cryptographic security. This is acceptable for a social game among friends. For a competitive/monetized version, server-side validation via Cloud Functions would be required.

### Card Deck Data

**Location**: `/data/india.json` (PRESERVED from existing repo)

**Format** (source - no IDs):
```json
{
  "blackCards": [
    { "text": "What's the most Indian way to solve a problem?", "pick": 1 },
    ...
  ],
  "whiteCards": [
    { "text": "Chai break" },
    ...
  ]
}
```

**Usage**: 
1. Load at game creation (not per-round)
2. Generate IDs using index-based strategy
3. Shuffle and store in `GameDocument.deck`
4. Pop cards as needed for rounds

---

## Name Generator (Clarification)

The existing `/lib/utils/nameGenerator.ts` generates names like `CleverMango123` (no space, with number suffix).

**Actual Format**: `{Adjective}{Noun}{1-999}`
- Examples: `SwiftTiger42`, `NobleLotus888`, `BravePeacock1`

**NOT**: "Clever Mango" (with space) as stated in previous acceptance criteria.

The new app will port this exact logic. Acceptance criteria updated to match actual format.

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (new project)
- **User wants tests**: TDD from beginning
- **Framework**: Vitest + @solidjs/testing-library

### TDD Approach
Each feature follows RED-GREEN-REFACTOR:
1. **RED**: Write failing test first
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up while keeping green

### Test Commands
```bash
bun run test                      # Run all tests (invokes vitest)
bun run test src/lib/game         # Run specific directory
bun run test -- --coverage        # With coverage report
bun run test -- --watch           # Watch mode
```

### Firebase Testing Strategy (CRITICAL - Avoiding Production Writes)

**CHOSEN APPROACH**: Pure mocks for unit tests + Emulator for integration tests (optional).

#### Pure Mocking (Required for All Tests)

All Firebase-dependent tests MUST use mocks, not real Firebase:

```typescript
// src/test/mocks/firebase.ts
import { vi } from 'vitest';

// Mock Firebase config - never loads real credentials
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
};

export const mockDb = {
  // Mock Firestore operations
};

// Mock the config module
vi.mock('~/lib/firebase/config', () => ({
  auth: mockAuth,
  db: mockDb,
  app: {},
}));
```

**Usage in tests**:
```typescript
// src/lib/game/rules.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '~/test/mocks/firebase'; // Load mocks FIRST
import { isValidSubmission, canStartGame } from './rules';

describe('Game Rules', () => {
  it('requires at least 3 players to start', () => {
    expect(canStartGame(['p1', 'p2'])).toBe(false);
    expect(canStartGame(['p1', 'p2', 'p3'])).toBe(true);
  });
});
```

#### Environment Variable Separation

```bash
# .env.test (committed - safe placeholder values)
VITE_FIREBASE_API_KEY=test-api-key
VITE_FIREBASE_PROJECT_ID=test-project
# ... other test values

# .env.local (NOT committed - real values for dev/manual testing)
VITE_FIREBASE_API_KEY=real-api-key
# ...
```

**Vitest config** (`vitest.config.ts`):
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Load .env.test for tests, not .env.local
    env: {
      VITE_FIREBASE_PROJECT_ID: 'test-project',
    },
  },
});
```

#### Firebase Emulator (Optional - for Integration Tests)

If deeper integration testing is needed (not required for MVP):

```bash
# Start emulator
firebase emulators:start --only firestore,auth

# Run integration tests against emulator
FIRESTORE_EMULATOR_HOST=localhost:8080 bun run test:integration
```

**Integration test detection**:
```typescript
// src/lib/firebase/config.ts
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';

// Auto-connect to emulator if env var is set
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

#### Test Categories

| Test Type | Firebase Approach | Run Command |
|-----------|------------------|-------------|
| Unit tests (rules, utils) | Pure mocks | `bun run test` |
| Component tests | Pure mocks | `bun run test` |
| Integration tests (optional) | Emulator | `bun run test:integration` |
| E2E tests (optional) | Emulator or real (staging) | `bun run test:e2e` |

**MVP Requirement**: All tasks can be completed with pure mocks only. Emulator is nice-to-have.

### Animation Library Testing Strategy (GSAP, Draggable, canvas-confetti)

**APPROACH**: Mock animation libraries in unit tests; verify visual correctness via manual `/test-*` routes.

Animation libraries (GSAP, Draggable, canvas-confetti) require DOM APIs not available in jsdom.
We mock them to verify:
1. Functions are called with correct parameters
2. Components wire up animations correctly
3. Callbacks are triggered appropriately

**Mock Setup** (`src/test/mocks/gsap.ts`):
```typescript
import { vi } from 'vitest';

export const mockGsap = {
  to: vi.fn().mockReturnValue({ kill: vi.fn() }),
  from: vi.fn().mockReturnValue({ kill: vi.fn() }),
  timeline: vi.fn().mockReturnValue({
    to: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    kill: vi.fn(),
  }),
  registerPlugin: vi.fn(),
};

export const mockDraggable = {
  create: vi.fn().mockReturnValue([{ kill: vi.fn() }]),
};

vi.mock('gsap', () => ({ default: mockGsap, gsap: mockGsap }));
vi.mock('gsap/Draggable', () => ({ Draggable: mockDraggable }));
```

**Mock Setup** (`src/test/mocks/confetti.ts`):
```typescript
import { vi } from 'vitest';

export const mockConfetti = vi.fn().mockResolvedValue(undefined);
vi.mock('canvas-confetti', () => ({ default: mockConfetti }));
```

**Example Animation Test** (`src/lib/animations/cardAnimations.test.ts`):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockGsap } from '~/test/mocks/gsap';
import '~/test/mocks/gsap';  // Load mocks
import { flipCard, shakeCard } from './cardAnimations';

describe('Card Animations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flipCard calls gsap.to with rotateY 180', () => {
    const mockElement = document.createElement('div');
    flipCard(mockElement);
    
    expect(mockGsap.to).toHaveBeenCalledWith(
      mockElement,
      expect.objectContaining({ rotateY: 180 })
    );
  });

  it('shakeCard creates oscillating animation', () => {
    const mockElement = document.createElement('div');
    shakeCard(mockElement);
    
    expect(mockGsap.to).toHaveBeenCalled();
    // Verify shake parameters (rotation oscillation)
  });
});
```

**Example DraggableCard Test** (`src/components/game/DraggableCard.test.tsx`):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@solidjs/testing-library';
import '~/test/mocks/gsap';
import { mockDraggable } from '~/test/mocks/gsap';
import { DraggableCard } from './DraggableCard';

describe('DraggableCard', () => {
  it('initializes Draggable on mount', async () => {
    render(() => <DraggableCard card={{ id: '1', text: 'Test' }} />);
    
    // Wait for onMount
    await new Promise(r => setTimeout(r, 0));
    
    expect(mockDraggable.create).toHaveBeenCalled();
  });

  it('calls onCardPlayed when dropped in valid zone', () => {
    const onCardPlayed = vi.fn();
    // ... test drop behavior via mock callbacks
  });
});
```

**What Tests Verify vs What Manual Verification Covers**:

| Aspect | Unit Test (Mocked) | Manual Verification |
|--------|-------------------|---------------------|
| Animation function called | ✅ | - |
| Correct parameters passed | ✅ | - |
| Cleanup on unmount | ✅ | - |
| Visual smoothness (60fps) | ❌ | ✅ |
| Animation looks correct | ❌ | ✅ |
| Drag feels responsive | ❌ | ✅ |
| Particles visible | ❌ | ✅ |

### Manual Verification (When Playwright Not Available)

For visual/interactive verification without Playwright setup:

1. **Start dev server**: `bun dev`
2. **Navigate manually** to test routes (created during tasks)
3. **Capture screenshots**: Use browser dev tools or OS screenshot
4. **Save to**: `.sisyphus/evidence/task-{N}-{description}.png`

### Performance Measurement

**Bundle Size**:
```bash
bun run build
# Output shows chunk sizes in terminal
# OR use: bunx source-map-explorer dist/**/*.js
```

**60fps Verification**:
```bash
# In browser DevTools:
# 1. Open Performance tab
# 2. Record during animation
# 3. Check for frames >16.67ms (drops below 60fps)
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Delete existing code & create SolidStart project
├── Task 2: Create AGENTS.md
└── Task 3: Setup Vitest testing infrastructure

Wave 2 (After Wave 1):
├── Task 4: Firebase integration (config, auth hooks)
├── Task 5: Base UI components (Tailwind + primitives)
└── Task 6: 3D Card component with CSS structure

Wave 3 (After Wave 2):
├── Task 7: GSAP animations (flip, shake, deal)
├── Task 8: Drag-to-play with GSAP Draggable
└── Task 9: Particle effects with canvas-confetti

Wave 4 (After Wave 3):
├── Task 10: Authentication flows (email, Google, anonymous)
└── Task 11: Game state machine with Solid signals

Wave 5 (After Wave 4):
├── Task 12: Game creation & lobby
├── Task 13: Real-time gameplay (card play, judging)
└── Task 14: Scoring & game end

Wave 6 (After Wave 5):
└── Task 15: Polish, error handling, deployment config

Critical Path: Task 1 → Task 6 → Task 7 → Task 11 → Task 13 → Task 15
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4,5,6,7,8,9,10,11,12,13,14,15 | 2,3 |
| 2 | None | None | 1,3 |
| 3 | None | 4,5,6,7,8,9,10,11,12,13,14 | 1,2 |
| 4 | 1 | 10,11,12,13 | 5,6 |
| 5 | 1 | 10,12 | 4,6 |
| 6 | 1 | 7,8 | 4,5 |
| 7 | 6 | 13 | 8,9 |
| 8 | 6 | 13 | 7,9 |
| 9 | 6 | 14 | 7,8 |
| 10 | 4,5 | 12 | 11 |
| 11 | 4 | 12,13 | 10 |
| 12 | 10,11 | 13 | None |
| 13 | 7,8,11,12 | 14 | None |
| 14 | 9,13 | 15 | None |
| 15 | 14 | None | None |

---

## Work Objectives

### Core Objective
Delete the broken Next.js codebase and create a new SolidStart application with impressive 3D card animations, real-time multiplayer gameplay, and proper architecture for scale.

### Concrete Deliverables
1. `/` - New SolidStart project root (replaces existing)
2. `/AGENTS.md` - AI coding guidelines for new stack
3. `/src/components/game/Card.tsx` - 3D animated card component
4. `/src/lib/animations/` - GSAP animation utilities
5. `/src/lib/firebase/` - Firebase integration hooks
6. `/src/routes/(game)/[roomId].tsx` - Real-time game room
7. Full CAH gameplay loop (create, join, play, judge, score)

### Definition of Done
- [ ] `bun dev` starts development server without errors
- [ ] `bun run test` runs all tests with >80% coverage on game logic
- [ ] Card flip animation renders at 60fps on mobile
- [ ] 4 players can play a complete game in real-time
- [ ] Anonymous login generates Indian-themed names (format: `CleverMango123`)
- [ ] All 6 animation features working

### Must Have
- SolidStart + Bun project structure
- Firebase Auth (email, Google, anonymous)
- Firebase Firestore for game state
- All 6 card animations
- CAH core gameplay
- AGENTS.md documentation
- TDD test coverage

### Must NOT Have (Guardrails)
- ❌ Custom card deck creation (Phase 2)
- ❌ Sound effects (nice-to-have, not MVP)
- ❌ AI commentary (Phase 2)
- ❌ Leaderboards/progression (Phase 2)
- ❌ Social features (friends, invites) (Phase 2)
- ❌ Localization (Phase 2)
- ❌ Premium/monetization (Phase 3)
- ❌ Three.js or heavy 3D engines
- ❌ Over-engineering for scale before product-market fit

---

## TODOs

### Task 1: Delete Existing Code & Create SolidStart Project

**What to do**:
1. **FIRST - Preserve files needed for later tasks**:
   - Copy `lib/utils/nameGenerator.ts` content to `.sisyphus/preserved/nameGenerator.ts.txt` (for Task 10)
   - Copy `.env.local` to `.env.local.backup`

2. **Delete directories** (comprehensive list for this repo):
   ```bash
   rm -rf app/ components/ lib/ hooks/ context/ types/ providers/ scripts/ memory-bank/ .windsurf/ .next/ node_modules/ public/
   ```

3. **Delete files** (comprehensive list):
   ```bash
   rm -f package.json package-lock.json bun.lock tsconfig.json next.config.ts tailwind.config.js postcss.config.mjs eslint.config.mjs components.json next-env.d.ts README.md LICENSE features.md .clinerules .windsurfrules
   ```

4. **PRESERVE these files/directories** (do NOT delete):
   ```
   .git/                       # Git history (CRITICAL)
   .sisyphus/                  # Plans and preserved content
   .env.local                  # Will be migrated (backup already made)
   .env.local.backup           # Backup from step 1
   .firebaserc                 # Firebase project binding
   firebase.json               # Firebase config
   firestore.rules             # Security rules
   firestore.indexes.json      # Indexes
   data/india.json             # Card deck
   .credentials/               # Firebase admin credentials (for future use)
   .gitignore                  # Already configured
   ```

5. Create new SolidStart project:

   **SAFE SCAFFOLD PROCEDURE** (handles non-empty directory):
   ```bash
   # Step A: Create scaffold in temp directory
   cd /tmp
   bun create solid@latest ses-scaffold
   # When prompted:
   #   - Template: solidstart
   #   - TypeScript: yes
   
   # Step B: Copy scaffold files to repo (explicit, safe)
   cd /path/to/repo
   cp -r /tmp/ses-scaffold/src ./
   cp /tmp/ses-scaffold/package.json ./
   cp /tmp/ses-scaffold/tsconfig.json ./
   cp /tmp/ses-scaffold/app.config.ts ./
   cp /tmp/ses-scaffold/.gitignore ./gitignore.solidstart  # Rename to avoid conflict
   # Merge .gitignore manually: add SolidStart ignores to existing
   
   # Step C: Cleanup
   rm -rf /tmp/ses-scaffold
   ```

   **What NOT to copy**:
   - `.git/` from scaffold (we keep ours)
   - Any file that conflicts with preserved files

6. Merge .gitignore: Append SolidStart-specific ignores to existing:
   ```bash
   cat gitignore.solidstart >> .gitignore
   rm gitignore.solidstart
   # Deduplicate if needed
   ```

7. Migrate env vars: Read `.env.local.backup`, transform `NEXT_PUBLIC_FIREBASE_*` to `VITE_FIREBASE_*`, write new `.env.local`
   - Extract ONLY the 7 client-side config vars
   - Do NOT copy FIREBASE_ADMIN_*, private keys, or service account paths

8. Create `.env.example` template (safe placeholders)

9. Configure app.config.ts for Vercel deployment:
   ```typescript
   import { defineConfig } from '@solidjs/start/config';
   export default defineConfig({
     server: { preset: 'vercel' }
   });
   ```

10. Setup Tailwind CSS 4:
    ```bash
    bun add -d tailwindcss @tailwindcss/postcss postcss
    # Create tailwind.config.ts, postcss.config.ts, src/app.css
    ```

11. Install dependencies: `bun install`

12. Verify preserved files exist:
    ```bash
    ls -la firebase.json firestore.rules firestore.indexes.json data/india.json .sisyphus/preserved/nameGenerator.ts.txt
    ```

13. Keep `.env.local.backup` for reference (git-ignored, safe to retain)

**Must NOT do**:
- Do not delete `.git/` directory (preserve history)
- Do not delete `.sisyphus/` directory (plans and preserved content)
- Do not delete `firebase.json`, `firestore.rules`, `firestore.indexes.json`
- Do not delete `data/india.json` (card deck)
- Do not delete `.firebaserc` (Firebase project binding)
- Do not delete `.credentials/` directory (admin SDK credentials)
- Do not delete `.gitignore` (already configured)
- Do not use unsafe shell patterns like `mv ./*` or `.*` (can match `.` and `..`)
- Do not copy FIREBASE_ADMIN_* secrets to new .env.local

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: `[]`
- Reason: Straightforward project scaffolding with careful file operations

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 2, 3)
- **Blocks**: All subsequent tasks
- **Blocked By**: None

**References**:
- SolidStart quickstart: https://start.solidjs.com/getting-started
- Preserve: `/firebase.json`, `/firestore.rules`, `/firestore.indexes.json`, `/data/india.json`

**Acceptance Criteria**:

```bash
# Agent runs:
bun dev
# Expected: Dev server starts on http://localhost:3000, no errors
```

```bash
# Agent runs:
ls -la
# Expected: package.json exists with @solidjs/start dependency
# Expected: app.config.ts exists
# Expected: firebase.json exists (was preserved)
# Expected: data/india.json exists (was preserved)
# Expected: .sisyphus/preserved/nameGenerator.ts.txt exists (for Task 10)
```

```bash
# Agent runs:
cat .env.example
# Expected: Contains VITE_FIREBASE_* placeholders
```

```bash
# Agent runs:
cat .sisyphus/preserved/nameGenerator.ts.txt | head -20
# Expected: Contains "const firstParts" and "generateRandomName"
```

**Evidence to Capture**:
- [ ] Terminal output from `bun dev` showing successful start
- [ ] `ls -la` showing preserved files (firebase.json, data/, .sisyphus/)
- [ ] `.env.example` content
- [ ] Preserved nameGenerator.ts.txt exists

**Commit**: YES
- Message: `feat: initialize SolidStart project with Bun, migrate from Next.js`
- Files: All new files
- Pre-commit: `bun run build`

---

### Task 2: Create AGENTS.md

**What to do**:
- Create comprehensive AGENTS.md file at project root (~150 lines)
- Include: build/lint/test commands for SolidStart + Bun
- Include: code style guidelines (TypeScript, naming, imports for SolidJS)
- Include: SolidJS-specific patterns (signals, createEffect, createResource)
- Include: GSAP animation patterns for Solid
- Include: Firebase integration patterns with solid-firebase
- Include: Project structure explanation
- **Do NOT include**: React patterns, Next.js patterns, shadcn/ui

**Must NOT do**:
- Do not include Next.js patterns (we're replacing it)
- Do not include React patterns (SolidJS is different)
- Do not reference `.windsurf/rules` (will be deleted)

**Recommended Agent Profile**:
- **Category**: `writing`
- **Skills**: `[]`
- Reason: Documentation task requiring clear technical writing

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 1, 3)
- **Blocks**: None (informational)
- **Blocked By**: None

**References**:
- SolidStart conventions: https://start.solidjs.com/
- SolidJS reactivity: https://www.solidjs.com/guides/reactivity
- GSAP docs: https://greensock.com/docs/

**Acceptance Criteria**:

```bash
# Agent runs:
head -100 AGENTS.md
# Expected: Contains "SolidStart" or "SolidJS"
# Expected: Contains "bun dev", "bun run test"
# Expected: Contains TypeScript guidelines
# Expected: Does NOT contain "Next.js" or "React"
```

```bash
# Agent runs:
wc -l AGENTS.md
# Expected: Approximately 150 lines (120-180 range)
```

**Evidence to Capture**:
- [ ] First 50 lines of AGENTS.md
- [ ] Line count verification

**Commit**: YES
- Message: `docs: add AGENTS.md with SolidStart coding guidelines`
- Files: `AGENTS.md`
- Pre-commit: None

---

### Task 3: Setup Vitest Testing Infrastructure

**What to do**:
- Install: `bun add -d vitest @solidjs/testing-library jsdom @testing-library/jest-dom`
- Create `vitest.config.ts` with SolidJS support (vite-plugin-solid)
- Create `src/test/setup.ts` with cleanup and jest-dom matchers
- Create `src/test/example.test.ts` to verify setup
- Add scripts to package.json: `"test": "vitest"`, `"test:coverage": "vitest --coverage"`

**Must NOT do**:
- Do not create comprehensive tests yet (just infrastructure)
- Do not add Jest (we're using Vitest)

**Recommended Agent Profile**:
- **Category**: `quick`
- **Skills**: `[]`
- Reason: Standard test infrastructure setup

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with Tasks 1, 2)
- **Blocks**: All test-related work
- **Blocked By**: None

**References**:
- Vitest config: https://vitest.dev/config/
- Solid testing: https://github.com/solidjs/solid-testing-library

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test
# Expected: Exit code 0
# Expected: Output shows "1 passed" or similar
```

```bash
# Agent runs:
cat vitest.config.ts
# Expected: Contains "solid" plugin or vite-plugin-solid
# Expected: Contains "jsdom" environment
```

**Evidence to Capture**:
- [ ] `bun run test` output showing pass
- [ ] vitest.config.ts content

**Commit**: YES
- Message: `test: setup Vitest testing infrastructure`
- Files: `vitest.config.ts`, `src/test/setup.ts`, `src/test/example.test.ts`, `package.json`
- Pre-commit: `bun run test`

---

### Task 4: Firebase Integration

**What to do**:
- Install: `bun add firebase solid-firebase`
- Create `src/lib/firebase/config.ts`:
  ```typescript
  // ⚠️ SSR WARNING: This file uses browser-only Firebase APIs.
  // Only import from:
  // 1. Components wrapped with clientOnly()
  // 2. Inside onMount() callbacks (dynamic import)
  // 3. Event handlers (user interaction)
  //
  // ❌ NEVER import at top-level of SSR-enabled routes!
  
  import { initializeApp, getApps } from 'firebase/app';
  import { getAuth } from 'firebase/auth';
  import { getFirestore } from 'firebase/firestore';
  
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
  
  // Singleton pattern - prevent multiple initializations
  function getFirebaseApp() {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp(firebaseConfig);
  }
  
  export const app = getFirebaseApp();
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  ```
- Create `src/lib/firebase/auth.ts` - Wrapper around solid-firebase's `useAuth`:
  ```typescript
  // solid-firebase API: useAuth(auth) - REQUIRES passing auth instance
  import { useAuth } from 'solid-firebase';
  import { auth } from './config';  // Import our configured auth instance
  
  // Wrapper that binds to our auth instance
  export function useAppAuth() {
    return useAuth(auth);  // Returns { data: User | null, loading, error }
  }
  
  // Custom wrapper for anonymous login with name generation
  export function useAuthWithAnonymousName() {
    const authState = useAuth(auth);
    // ... generates name on anonymous sign-in
  }
  ```
- Create `src/lib/firebase/firestore.ts` - Wrapper around solid-firebase's `useFirestore`:
  ```typescript
  // solid-firebase API: useFirestore(query) - takes Firestore Query/DocumentReference
  import { useFirestore } from 'solid-firebase';
  import { doc, collection, query } from 'firebase/firestore';
  import { db } from './config';  // Import our configured db instance
  
  // Example usage: useFirestore returns { data, loading, error }
  export function useGameDoc(gameId: string) {
    const gameRef = doc(db, 'games', gameId);
    return useFirestore(gameRef);  // Subscribes to doc changes
  }
  
  export function usePlayerHand(gameId: string, playerId: string) {
    const handRef = doc(db, 'games', gameId, 'playerHands', playerId);
    return useFirestore(handRef);  // Returns reactive { data, loading, error }
  }
  ```
- Create tests for hooks (mock Firebase)

**solid-firebase API Note**: 
The library provides `useAuth()` and `useFirestore()` primitives, not custom hook names. Our wrappers will use these internally but expose game-specific helpers.

**Must NOT do**:
- Do not create new Firebase project (use existing)
- Do not modify firebase.json or firestore.rules

**Recommended Agent Profile**:
- **Category**: `unspecified-low`
- **Skills**: `[]`
- Reason: Standard Firebase integration

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 2 (with Tasks 5, 6)
- **Blocks**: Tasks 10, 11, 12, 13
- **Blocked By**: Task 1

**References**:
- solid-firebase: https://github.com/wobsoriano/solid-firebase
- Firebase Web SDK: https://firebase.google.com/docs/web/setup

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test src/lib/firebase/
# Expected: All tests pass
```

```bash
# Agent runs:
cat src/lib/firebase/config.ts
# Expected: Contains "initializeApp"
# Expected: Uses "import.meta.env.VITE_FIREBASE_*"
```

**Evidence to Capture**:
- [ ] config.ts content
- [ ] Test output

**Commit**: YES
- Message: `feat(firebase): add Firebase integration with Solid hooks`
- Files: `src/lib/firebase/*`, `package.json`
- Pre-commit: `bun run test`

---

### Task 5: Base UI Components

**What to do**:
- Install: `bun add -d @tailwindcss/postcss` (Tailwind CSS 4)
- Create `tailwind.config.ts` and `postcss.config.ts`
- Create `src/styles/globals.css` with Tailwind directives and CSS variables for dark/light mode
- Create components in `src/components/ui/`:
  - `Button.tsx` - Primary, secondary, ghost variants
  - `Input.tsx` - Text input with label and error states
  - `Card.tsx` - Container card (not game card)
  - `Modal.tsx` - Dialog component
- Create `src/routes/test-components.tsx` for visual verification
- Create tests for components

**Must NOT do**:
- Do not use shadcn/ui (React-based)
- Do not over-engineer

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: UI component design

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 2 (with Tasks 4, 6)
- **Blocks**: Tasks 10, 12
- **Blocked By**: Task 1

**References**:
- Tailwind CSS 4: https://tailwindcss.com/docs
- SolidJS component patterns: https://www.solidjs.com/guides/getting-started

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test src/components/ui/
# Expected: All component tests pass
```

**Manual verification**:
1. Start `bun dev`
2. Navigate to http://localhost:3000/test-components
3. Verify Button, Input, Card, Modal render correctly
4. Screenshot: `.sisyphus/evidence/task-5-ui-components.png`

**Evidence to Capture**:
- [ ] Screenshot of test-components page
- [ ] tailwind.config.ts content

**Commit**: YES
- Message: `feat(ui): add base UI components with Tailwind`
- Files: `src/components/ui/*`, `tailwind.config.ts`, `postcss.config.ts`, `src/styles/globals.css`
- Pre-commit: `bun run test`

---

### Task 6: 3D Card Component with CSS Structure

**What to do**:
- Create `src/components/game/Card.tsx` with 3D CSS structure:
  ```tsx
  // Card wrapper with perspective
  // .card-inner with transform-style: preserve-3d
  // .card-front and .card-back with backface-visibility: hidden
  // .card-back rotated 180deg
  ```
- Create `src/styles/card.css` with 3D transforms
- Implement two card types: BlackCard (dark bg, white text), WhiteCard (light bg, dark text)
- Add hover state with subtle 3D tilt
- Create `src/routes/test-card.tsx` for visual verification
- Create tests for Card component

**Must NOT do**:
- Do not add GSAP animations yet (Task 7)
- Do not add drag functionality yet (Task 8)

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: 3D CSS expertise

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 2 (with Tasks 4, 5)
- **Blocks**: Tasks 7, 8
- **Blocked By**: Task 1

**References**:
- CSS 3D card flip: https://3dtransforms.desandro.com/card-flip
- CAH card design (black cards with white text, white cards with black text)

**Acceptance Criteria**:

```bash
# Agent runs:
cat src/styles/card.css
# Expected: Contains "transform-style: preserve-3d"
# Expected: Contains "backface-visibility: hidden"
# Expected: Contains "rotateY(180deg)"
```

**Manual verification**:
1. Start `bun dev`
2. Navigate to http://localhost:3000/test-card
3. Verify cards have 3D perspective
4. Hover over card, verify subtle tilt effect
5. Screenshot: `.sisyphus/evidence/task-6-card-3d.png`

**Evidence to Capture**:
- [ ] Screenshot of cards with hover
- [ ] card.css content

**Commit**: YES
- Message: `feat(game): add 3D card component with CSS transforms`
- Files: `src/components/game/Card.tsx`, `src/styles/card.css`, `src/routes/test-card.tsx`
- Pre-commit: `bun run test`

---

### Task 7: GSAP Animations (Flip, Shake, Deal)

**What to do**:
- Install: `bun add gsap`
- Create `src/lib/animations/cardAnimations.ts`:
  - `flipCard(element, duration?)` - Rotate Y 180deg
  - `shakeCard(element)` - Small rotation oscillation
  - `dealCards(elements, stagger?)` - Staggered entrance from deck position
- Create `src/lib/animations/useGSAP.ts` - Solid hook for GSAP with cleanup
- Wire animations to Card component (add `flip()`, `shake()` methods)
- Create `src/routes/test-animations.tsx` with buttons to trigger each animation
- Create tests for animation functions

**Must NOT do**:
- Do not implement drag yet (Task 8)
- Do not implement particles yet (Task 9)

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: Animation timing expertise

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 3 (with Tasks 8, 9)
- **Blocks**: Task 13
- **Blocked By**: Task 6

**References**:
- GSAP basics: https://greensock.com/docs/v3/GSAP
- GSAP timelines: https://greensock.com/docs/v3/GSAP/Timeline

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test src/lib/animations/
# Expected: Animation utility tests pass
```

**Manual verification**:
1. Start `bun dev`
2. Navigate to http://localhost:3000/test-animations
3. Click "Flip Card" → card rotates 180deg
4. Click "Shake Card" → card wiggles
5. Click "Deal Cards" → multiple cards animate in sequence
6. Screenshot: `.sisyphus/evidence/task-7-gsap-animations.png`

**Evidence to Capture**:
- [ ] Screenshot after animations
- [ ] cardAnimations.ts code

**Commit**: YES
- Message: `feat(animation): add GSAP card animations (flip, shake, deal)`
- Files: `src/lib/animations/*`, `package.json`
- Pre-commit: `bun run test`

---

### Task 8: Drag-to-Play with GSAP Draggable

**What to do**:
- Register GSAP Draggable plugin
- Create `src/components/game/DraggableCard.tsx` - Card with drag behavior
- Create `src/components/game/PlayArea.tsx` - Drop zone for cards
- Implement:
  - Drag constraints (stay within game area)
  - Drop detection (onDragEnd check if over PlayArea)
  - Snap-back animation if dropped outside
  - onCardPlayed callback when dropped in PlayArea
- Create `src/routes/test-drag.tsx` for verification
- Create tests

**Must NOT do**:
- Do not integrate with game logic yet (Task 13)

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: Drag UX design

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 3 (with Tasks 7, 9)
- **Blocks**: Task 13
- **Blocked By**: Task 6

**References**:
- GSAP Draggable: https://greensock.com/docs/v3/Plugins/Draggable

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test src/components/game/DraggableCard
# Expected: Component tests pass (renders, handles drag callbacks)
```

```bash
# Agent runs:
bun run test src/components/game/PlayArea
# Expected: Component tests pass (renders drop zone, detects hits)
```

**Manual verification**:
1. Start `bun dev`
2. Navigate to http://localhost:3000/test-drag
3. Drag card from hand area toward play area → card follows cursor
4. Drop on play area → card stays
5. Drag another card, drop outside → card snaps back
6. Screenshot: `.sisyphus/evidence/task-8-drag-to-play.png`

**Evidence to Capture**:
- [ ] Screenshot of drag interaction
- [ ] DraggableCard.tsx code

**Commit**: YES
- Message: `feat(animation): add drag-to-play with GSAP Draggable`
- Files: `src/components/game/DraggableCard.tsx`, `src/components/game/PlayArea.tsx`
- Pre-commit: `bun run test`

---

### Task 9: Particle Effects with canvas-confetti

**What to do**:
- Install: `bun add canvas-confetti` (~3KB)
- Create `src/lib/animations/particles.ts`:
  - `confettiCelebration()` - Basic confetti burst
  - `winnerReveal()` - More elaborate celebration for round winner
- Create `src/routes/test-particles.tsx` with trigger buttons
- Create tests

**Must NOT do**:
- Do not use tsParticles (15KB, too heavy)

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: Visual effects

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 3 (with Tasks 7, 8)
- **Blocks**: Task 14
- **Blocked By**: Task 6

**References**:
- canvas-confetti: https://github.com/catdad/canvas-confetti

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test src/lib/animations/particles
# Expected: Tests pass (confettiCelebration and winnerReveal exported, callable)
```

**Manual verification**:
1. Start `bun dev`
2. Navigate to http://localhost:3000/test-particles
3. Click "Celebrate" → confetti particles appear
4. Screenshot during animation: `.sisyphus/evidence/task-9-particles.png`

**Evidence to Capture**:
- [ ] Screenshot of confetti
- [ ] particles.ts code

**Commit**: YES
- Message: `feat(animation): add particle celebration effects`
- Files: `src/lib/animations/particles.ts`, `package.json`
- Pre-commit: `bun run test`

---

### Task 10: Authentication Flows

**What to do**:
- Create `src/routes/(auth)/login.tsx` with:
  - Email/password login form
  - Google sign-in button
  - "Play as Guest" button (anonymous auth)
  
  **⚠️ SSR-SAFE PATTERN FOR LOGIN PAGE**:
  The login page can be SSR-enabled for SEO, but Firebase must only load on user interaction:
  ```typescript
  // src/routes/(auth)/login.tsx
  export default function LoginPage() {
    const handleGuestLogin = async () => {
      // Dynamic import - only runs when user clicks
      const { auth } = await import('~/lib/firebase/config');
      const { signInAnonymously } = await import('firebase/auth');
      await signInAnonymously(auth);
    };
    
    const handleGoogleLogin = async () => {
      const { auth } = await import('~/lib/firebase/config');
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      await signInWithPopup(auth, new GoogleAuthProvider());
    };
    
    return (
      <div>
        <button onClick={handleGuestLogin}>Play as Guest</button>
        <button onClick={handleGoogleLogin}>Sign in with Google</button>
      </div>
    );
  }
  ```
  
- Create `src/routes/(auth)/signup.tsx` with email registration (same dynamic import pattern)
- Create `src/components/auth/AuthForm.tsx` reusable form
- Create `src/lib/utils/nameGenerator.ts`:
  - Port logic from existing `/lib/utils/nameGenerator.ts`
  - Format: `{Adjective}{Noun}{1-999}` (e.g., `CleverMango123`)
- Create `src/components/auth/ProtectedRoute.tsx` wrapper
- Create tests

**Must NOT do**:
- Do not add Facebook auth (simplify MVP)
- Do not add account conversion (Phase 2)

**Recommended Agent Profile**:
- **Category**: `unspecified-low`
- **Skills**: `[]`
- Reason: Standard auth flows

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 4 (with Task 11)
- **Blocks**: Task 12
- **Blocked By**: Tasks 4, 5

**References**:
- Preserved nameGenerator: `.sisyphus/preserved/nameGenerator.ts.txt` (saved in Task 1 before deletion)
- Original logic to port:
  ```typescript
  const firstParts = ["Clever", "Swift", "Mighty", "Brave", ...];
  const secondParts = ["Peacock", "Tiger", "Lotus", "Elephant", ...];
  // Returns: `${first}${second}${randomNum}` (no spaces)
  ```
- solid-firebase auth: https://github.com/wobsoriano/solid-firebase

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test src/lib/utils/nameGenerator
# Expected: Name matches format /^[A-Z][a-z]+[A-Z][a-z]+\d{1,3}$/
```

**Manual verification**:
1. Start `bun dev`
2. Navigate to http://localhost:3000/login
3. Click "Play as Guest"
4. Verify: User logged in with name like `SwiftTiger42`
5. Verify: Redirected to home/dashboard
6. Screenshot: `.sisyphus/evidence/task-10-auth.png`

**Evidence to Capture**:
- [ ] Screenshot of login page
- [ ] Screenshot after login showing generated name

**Commit**: YES
- Message: `feat(auth): add authentication flows with anonymous Indian names`
- Files: `src/routes/(auth)/*`, `src/components/auth/*`, `src/lib/utils/nameGenerator.ts`
- Pre-commit: `bun run test`

---

### Task 11: Game State Machine with Solid Signals

**What to do**:
- Create `src/types/game.ts` with TypeScript types (from Firestore schema above)
- Create `src/lib/game/state.ts`:
  - `createGameState(gameId)` - Returns signals for game state
  - Firestore listener integration
  - Local optimistic updates
- Create `src/lib/game/rules.ts`:
  - `isValidSubmission(hand, submission)` - Validate card selection
  - `canStartGame(players)` - Min 3 players
  - `getNextJudge(players, currentIndex)` - Rotate judge
  - `isRoundComplete(submissions, players)` - All non-judges submitted
  - `isGameOver(scores, winningScore)` - Check for winner
- Create comprehensive tests for rules
- **Conform to existing Firestore schema** (see Firestore Data Model section)

**Must NOT do**:
- Do not implement UI yet (Tasks 12, 13)
- Do not modify firestore.rules

**Recommended Agent Profile**:
- **Category**: `ultrabrain`
- **Skills**: `[]`
- Reason: State machine logic

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 4 (with Task 10)
- **Blocks**: Tasks 12, 13
- **Blocked By**: Task 4

**References**:
- Firestore schema: See "Firestore Data Model" section in this document
- Existing firestore.rules: `/firestore.rules` - understand existing paths

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test src/lib/game/
# Expected: All state/rules tests pass (>90% coverage)
```

```typescript
// Test file verifies:
// - createGameState returns reactive signals
// - isValidSubmission catches invalid cards
// - getNextJudge rotates correctly
// - isGameOver detects winner at winning score
```

**Evidence to Capture**:
- [ ] Test output with coverage
- [ ] state.ts and rules.ts code

**Commit**: YES
- Message: `feat(game): add game state machine with Solid signals`
- Files: `src/lib/game/*`, `src/types/*`
- Pre-commit: `bun run test`

---

### Task 12: Game Creation & Lobby

**What to do**:
- Create `src/routes/(game)/create.tsx` - Game creation form
- Create `src/routes/(game)/join.tsx` - Join via room code
- Create `src/routes/(game)/[roomId]/lobby.tsx` - Waiting room
- Create `src/lib/game/lobby.ts`:
  - `createGame(hostId, settings)` - Creates game doc + invite code
  - `joinGame(code, userId)` - Joins via invite code
  - `generateRoomCode()` - 6 alphanumeric characters
  - `subscribeToLobby(gameId)` - Real-time player list
- Implement host controls: Start game, Kick player
- Create tests

**Must NOT do**:
- Do not implement gameplay yet (Task 13)

**Recommended Agent Profile**:
- **Category**: `unspecified-low`
- **Skills**: `[]`
- Reason: Standard CRUD

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Sequential
- **Blocks**: Task 13
- **Blocked By**: Tasks 10, 11

**References**:
- Firestore paths: `/games/{gameId}`, `/inviteCodes/{code}`
- Existing firestore.rules for permissions

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test src/lib/game/lobby
# Expected: Tests pass for createGame, joinGame, generateRoomCode
# Expected: Covers: creates Firestore doc, generates 6-char code, adds player to playerUids
```

**Manual verification** (2 browser windows):
1. Browser 1: Login as guest, navigate to /create
2. Browser 1: Fill settings, click "Create Game"
3. Browser 1: Verify redirected to lobby, room code displayed
4. Browser 2: Login as different guest, navigate to /join
5. Browser 2: Enter room code, click "Join"
6. Browser 1 & 2: Verify both players appear in lobby
7. Screenshot: `.sisyphus/evidence/task-12-lobby.png`

**Evidence to Capture**:
- [ ] Screenshot of lobby with 2 players
- [ ] Room code visible

**Commit**: YES
- Message: `feat(game): add game creation and lobby`
- Files: `src/routes/(game)/*`, `src/lib/game/lobby.ts`
- Pre-commit: `bun run test`

---

### Task 13: Real-time Gameplay

**What to do**:
- Create `src/routes/(game)/[roomId]/play.tsx` - Main gameplay
- Create `src/components/game/GameBoard.tsx` - Layout for game
- Create `src/components/game/PlayerHand.tsx` - Player's cards (draggable)
- Create `src/components/game/JudgingArea.tsx` - Judge sees submissions
- Implement game flow:
  1. Round starts: Deal cards with animation
  2. Players submit: Drag white cards to play area
  3. All submitted: Switch to judging phase
  4. Judge selects: Winner revealed with celebration
  5. Next round: Rotate judge
- Add turn timeout (90 seconds)
- Create tests

**Must NOT do**:
- Do not add chat
- Do not add social features

**Recommended Agent Profile**:
- **Category**: `ultrabrain`
- **Skills**: `["frontend-ui-ux"]`
- Reason: Complex integration

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Sequential
- **Blocks**: Task 14
- **Blocked By**: Tasks 7, 8, 11, 12

**References**:
- Game state from Task 11
- Card animations from Tasks 7, 8
- Firestore schema for rounds
- Transaction Rules section for atomic operations

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test src/components/game/GameBoard
# Expected: Tests pass (renders layout, accepts game state props)
```

```bash
# Agent runs:
bun run test src/components/game/PlayerHand
# Expected: Tests pass (renders cards, triggers onCardPlayed callback)
```

```bash
# Agent runs:
bun run test src/lib/game/
# Expected: All game logic tests pass (state, rules, lobby combined)
```

**Manual verification** (3 browser windows):
1. Create game with 3 players
2. Host starts game
3. All: Cards dealt with animation
4. Non-judges: Submit white cards (drag to play area)
5. Judge: Sees anonymous submissions, selects winner
6. All: Winner announced, confetti, scores update
7. Verify: Next round starts with new judge
8. Screenshots: `.sisyphus/evidence/task-13-gameplay-*.png`

**Evidence to Capture**:
- [ ] Screenshot of gameplay
- [ ] Screenshot of judging
- [ ] Screenshot of round end

**Commit**: YES
- Message: `feat(game): add real-time gameplay with animations`
- Files: `src/routes/(game)/[roomId]/play.tsx`, `src/components/game/*`
- Pre-commit: `bun run test`

---

### Task 14: Scoring & Game End

**What to do**:
- Create `src/components/game/ScoreBoard.tsx` - Live scores
- Implement game end detection (first to winning score)
- Create game end screen with:
  - Winner celebration (particles)
  - Final standings
  - "Play Again" button (rematch with same players)
- Create tests

**Must NOT do**:
- Do not add game history (Phase 2)

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: Celebration UI

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Sequential
- **Blocks**: Task 15
- **Blocked By**: Tasks 9, 13

**References**:
- Particle effects from Task 9

**Acceptance Criteria**:

```bash
# Agent runs:
bun run test src/components/game/ScoreBoard
# Expected: Tests pass (renders scores, updates on prop change)
```

```bash
# Agent runs:
bun run test src/lib/game/rules.ts
# Expected: isGameOver tests pass (detects winner at winningScore)
```

**Manual verification**:
1. Play game until someone reaches winning score
2. Verify: Confetti celebration plays
3. Verify: Winner name displayed
4. Verify: Final standings shown
5. Click "Play Again" → new game starts
6. Screenshot: `.sisyphus/evidence/task-14-game-end.png`

**Evidence to Capture**:
- [ ] Screenshot of winner celebration
- [ ] Screenshot of standings

**Commit**: YES
- Message: `feat(game): add scoring and game end celebration`
- Files: `src/components/game/ScoreBoard.tsx`, game end components
- Pre-commit: `bun run test`

---

### Task 15: Polish, Error Handling, Deployment Config

**What to do**:
- Add error boundaries (ErrorBoundary component)
- Add reconnection handling (detect offline, show banner, auto-retry)
- Add loading states (skeleton components)
- Responsive design pass (test 375px, 768px, 1024px viewports)
- Configure `app.config.ts` for Vercel:
  ```typescript
  export default defineConfig({
    server: { preset: "vercel" }
  });
  ```
- Add `public/robots.txt`, favicon, meta tags
- Run final checks

**Must NOT do**:
- Do not add analytics (Phase 2)

**Recommended Agent Profile**:
- **Category**: `visual-engineering`
- **Skills**: `["frontend-ui-ux"]`
- Reason: Polish requires UX expertise

**Parallelization**:
- **Can Run In Parallel**: NO
- **Parallel Group**: Final
- **Blocks**: None
- **Blocked By**: Task 14

**References**:
- SolidStart deployment: https://start.solidjs.com/guides/deployment

**Acceptance Criteria**:

```bash
# Agent runs:
bun run build
# Expected: Build succeeds
# Observe: Chunk sizes in output (total <150KB gzipped)
```

**Bundle size measurement** (GZIPPED - actual measurement):
```bash
# After build, measure actual gzipped sizes:
bun run build

# Method 1: Check Vite/Vinxi build output (shows gzipped sizes automatically)
# Look for lines like: "dist/assets/index-abc123.js  45.2 kB │ gzip: 14.8 kB"

# Method 2: Manually gzip and measure
gzip -c .output/public/_build/assets/*.js > /tmp/bundle.gz && ls -la /tmp/bundle.gz
# Expected: less than 153600 bytes (150KB)

# Method 3: Use bundlephobia-style analysis
bunx vite-bundle-analyzer
# Opens browser with treemap showing sizes
```

**Pass Criteria**: Total gzipped JS bundle < 150KB (153,600 bytes)
**Measurement Command**: `gzip -c .output/public/_build/assets/*.js > /tmp/all-js.gz && stat -f%z /tmp/all-js.gz`
(On Linux: `stat -c%s /tmp/all-js.gz`)

**Mobile verification** (manual):
1. Start `bun dev`
2. Open Chrome DevTools → Device Mode → iPhone SE (375x667)
3. Navigate through all pages
4. Verify: No horizontal scroll
5. Verify: All buttons/inputs are tap-friendly (min 44x44px)
6. Screenshot: `.sisyphus/evidence/task-15-mobile.png`

**Evidence to Capture**:
- [ ] Build output with chunk sizes
- [ ] Mobile screenshots
- [ ] app.config.ts content

**Commit**: YES
- Message: `chore: polish, error handling, and deployment config`
- Files: Various
- Pre-commit: `bun run build && bun run test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat: initialize SolidStart project with Bun, migrate from Next.js` | `*` | `bun dev` |
| 2 | `docs: add AGENTS.md with SolidStart coding guidelines` | `AGENTS.md` | N/A |
| 3 | `test: setup Vitest testing infrastructure` | `vitest.config.ts`, etc. | `bun run test` |
| 4 | `feat(firebase): add Firebase integration with Solid hooks` | `src/lib/firebase/*` | `bun run test` |
| 5 | `feat(ui): add base UI components with Tailwind` | `src/components/ui/*` | `bun run test` |
| 6 | `feat(game): add 3D card component with CSS transforms` | `src/components/game/Card.tsx` | `bun run test` |
| 7 | `feat(animation): add GSAP card animations (flip, shake, deal)` | `src/lib/animations/*` | `bun run test` |
| 8 | `feat(animation): add drag-to-play with GSAP Draggable` | `src/components/game/Draggable*` | `bun run test` |
| 9 | `feat(animation): add particle celebration effects` | `src/lib/animations/particles.ts` | `bun run test` |
| 10 | `feat(auth): add authentication flows with anonymous Indian names` | `src/routes/(auth)/*` | `bun run test` |
| 11 | `feat(game): add game state machine with Solid signals` | `src/lib/game/*` | `bun run test` |
| 12 | `feat(game): add game creation and lobby` | `src/routes/(game)/*` | `bun run test` |
| 13 | `feat(game): add real-time gameplay with animations` | Multiple | `bun run test` |
| 14 | `feat(game): add scoring and game end celebration` | `src/components/game/ScoreBoard.tsx` | `bun run test` |
| 15 | `chore: polish, error handling, and deployment config` | Various | `bun run build && bun run test` |

---

## Success Criteria

### Verification Commands

```bash
# Development server starts
bun dev
# Expected: Server on http://localhost:3000, no errors

# All tests pass
bun run test
# Expected: All tests pass, >80% coverage on game logic

# Production build succeeds
bun run build
# Expected: Build completes, bundle <150KB gzipped

# Type checking
bunx tsc --noEmit
# Expected: No TypeScript errors
```

### Final Checklist

- [ ] All "Must Have" features present and working
- [ ] All "Must NOT Have" items absent from codebase
- [ ] All 6 animation features working at 60fps
- [ ] 4 players can complete a full game
- [ ] Anonymous login generates Indian-themed names (format: `CleverMango123`)
- [ ] All tests pass
- [ ] Bundle size <150KB gzipped
- [ ] Mobile responsive (375px viewport works)
- [ ] AGENTS.md is comprehensive and accurate
- [ ] Deployable to Vercel
