# Architectural Decisions

## Test Strategy
- Using Playwright for E2E multiplayer tests
- Test file: `src/e2e/rigorous_multiplayer.spec.ts`

## Animation Strategy
- GSAP for card animations
- Deal animation should trigger via createEffect watching hand changes

---

## AFK Host Handover Mechanism Plan

**Date**: 2026-01-30  
**Context**: Task stab-8 - Plan for host handover if the original host disconnects or becomes AFK during an active game.

### Executive Summary
This plan outlines a presence-based AFK host detection and handover system using Firebase Realtime Database + Firestore hybrid approach. The system ensures game continuity when the original host disconnects by automatically promoting a new host with minimal disruption.

---

### 1. Current Architecture Analysis

#### Host Responsibilities (from `src/lib/game/actions.ts`):
- **Pre-game**: Kick players (`kickPlayerAction`)
- **Game start**: Deal initial cards, create first round (`startGameAction`)
- **During play**: Auto-submit for timeout players (`hostAutoSubmitForPlayers`)
- **During judging**: Auto-judge for timeout judge (`hostAutoJudge`)
- **Round transitions**: Trigger next round (`nextRoundAction`)

#### Current Limitations:
- No presence detection system exists (verified in `firestore.ts` - no presence logic)
- `GameDocument.hostId` is immutable after creation
- No heartbeat or "last seen" mechanism
- Host disconnection = game stuck (no auto-recovery)

---

### 2. Presence Detection Strategy

**Chosen Approach**: Firebase Realtime Database (RTDB) + Firestore Hybrid  
**Rationale**: Firestore has no native `onDisconnect()` - must leverage RTDB's connection awareness.

#### Implementation Pattern (from Firebase official docs):

```typescript
// RTDB presence tracking (client-side)
const uid = auth.currentUser.uid;
const rtdbPresenceRef = ref(realtimeDb, `status/${uid}`);
const firestorePresenceRef = doc(db, 'games', gameId, 'presence', uid);

// Set up RTDB presence
const connectedRef = ref(realtimeDb, '.info/connected');
onValue(connectedRef, (snapshot) => {
  if (snapshot.val() === false) return;
  
  // When connected, set up disconnect handler
  onDisconnect(rtdbPresenceRef).set({
    state: 'offline',
    lastChanged: serverTimestamp()
  });
  
  // Mark as online
  set(rtdbPresenceRef, {
    state: 'online',
    lastChanged: serverTimestamp()
  });
});

// Cloud Function mirrors RTDB -> Firestore
export const onPresenceChange = functions.database
  .ref('/status/{uid}')
  .onUpdate(async (change, context) => {
    const status = change.after.val();
    const gameId = await findActiveGameForUser(context.params.uid);
    if (!gameId) return;
    
    await admin.firestore()
      .collection('games')
      .doc(gameId)
      .collection('presence')
      .doc(context.params.uid)
      .set(status, { merge: true });
  });
```

#### Alternative (Simpler, No Cloud Functions):
**Client-side heartbeat with Firestore transaction**

```typescript
// Client sends heartbeat every 5 seconds
setInterval(() => {
  updateDoc(doc(db, 'games', gameId, 'presence', userId), {
    lastSeen: serverTimestamp(),
    state: 'online'
  });
}, 5000);

// Another client monitors host heartbeat
createEffect(() => {
  if (!game() || game().hostId !== myUserId) {
    const hostLastSeen = presence()[game().hostId]?.lastSeen;
    if (hostLastSeen && Date.now() - hostLastSeen > 15000) {
      // Host AFK for 15+ seconds -> trigger handover
      initiateHostHandover(gameId);
    }
  }
});
```

**Decision**: Start with **client-side heartbeat** (simpler, no backend deploy), upgrade to RTDB hybrid if heartbeat proves unreliable.

---

### 3. Host Handover Logic

#### Data Model Addition:

```typescript
// Add to GameDocument in src/types/game.ts
interface GameDocument {
  // ... existing fields
  hostId: string;
  hostHandoverHistory?: {
    previousHostId: string;
    newHostId: string;
    timestamp: Timestamp;
    reason: 'disconnect' | 'manual' | 'afk';
  }[];
}

// New subcollection: games/{gameId}/presence/{userId}
interface PresenceDocument {
  state: 'online' | 'offline';
  lastSeen: Timestamp;
  lastUpdated: Timestamp;
}
```

#### Handover Trigger Conditions:
1. **Detection Window**: Host missing heartbeat for >15 seconds
2. **Game Status**: Game is active (`status !== 'waiting' && status !== 'finished'`)
3. **Eligibility**: At least one other player is online

#### New Host Selection (Priority Order):
1. **First fallback**: Player with oldest `lastSeen` (most stable connection)
2. **Second fallback**: First player in `playerUids` array who is online
3. **Edge case**: If all players offline -> do nothing (game will resume when someone reconnects)

#### Handover Transaction:

```typescript
// New action in src/lib/game/actions.ts
export async function hostHandoverAction(
  gameId: string,
  triggeredByUserId: string,
  reason: 'afk' | 'disconnect' | 'manual'
) {
  await runTransaction(db, async (tx) => {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await tx.get(gameRef);
    const gameData = gameSnap.data() as GameDocument;
    
    // Verify current host is actually offline/AFK
    const presenceRef = doc(db, 'games', gameId, 'presence', gameData.hostId);
    const presenceSnap = await tx.get(presenceRef);
    const hostPresence = presenceSnap.data();
    
    const isHostAFK = !hostPresence || 
      (Date.now() - hostPresence.lastSeen.toMillis() > 15000);
    
    if (!isHostAFK && reason !== 'manual') {
      throw new Error('Host is still active');
    }
    
    // Get all online players
    const presenceSnaps = await Promise.all(
      gameData.playerUids.map(uid => 
        tx.get(doc(db, 'games', gameId, 'presence', uid))
      )
    );
    
    const onlinePlayers = gameData.playerUids.filter((uid, i) => {
      const presence = presenceSnaps[i].data();
      return presence?.state === 'online' && 
        (Date.now() - presence.lastSeen.toMillis() < 15000);
    });
    
    if (onlinePlayers.length === 0) {
      throw new Error('No online players to handover to');
    }
    
    // Select new host (oldest lastSeen)
    const newHostId = onlinePlayers.reduce((oldest, uid) => {
      const presenceData = presenceSnaps[gameData.playerUids.indexOf(uid)].data();
      const oldestPresence = presenceSnaps[gameData.playerUids.indexOf(oldest)].data();
      return presenceData.lastSeen < oldestPresence.lastSeen ? uid : oldest;
    });
    
    // Update game document
    tx.update(gameRef, {
      hostId: newHostId,
      hostHandoverHistory: arrayUnion({
        previousHostId: gameData.hostId,
        newHostId,
        timestamp: serverTimestamp(),
        reason
      }),
      updatedAt: serverTimestamp()
    });
  });
}
```

---

### 4. Edge Cases & Solutions

| Edge Case | Solution |
|-----------|----------|
| **Multiple players disconnect simultaneously** | Handover only triggers if ≥1 player remains online. New host = most stable connection (oldest `lastSeen`). |
| **Original host rejoins after handover** | Do NOT auto-revert. Original host becomes regular player. UI shows notification: "You were disconnected. [Player X] is now the host." |
| **New host also disconnects** | Recursive handover: Another online player auto-promoted using same logic. |
| **All players disconnect** | No handover. Game remains frozen. First player to rejoin sees frozen state. If that player was previous host, they can resume. If not, handover triggers when 2nd player joins. |
| **Heartbeat spam (network lag)** | Debounce heartbeat updates: Only send if >4 seconds since last send. |
| **Split-brain (two clients think they're host)** | Firestore rules enforce: Only `hostId` can execute host-only actions. If handover completes, old host's actions will fail with permission error. |
| **Malicious handover attempts** | Firestore rule: Handover transaction must verify current host is AFK (lastSeen >15s). Add rate limiting (max 1 handover per minute). |

---

### 5. UI/UX Considerations

#### Notifications:
- **Host disconnect**: Show toast to all players: "Host disconnected. [New Player] is now the host."
- **You became host**: Show prominent banner: "🎯 You are now the host. The game will continue automatically."
- **Original host rejoins**: Show to original host only: "You were disconnected. [Player X] is now the host."

#### Visual Indicators:
- Add crown icon (👑) next to host name in player list
- Update crown dynamically when handover occurs (use `createEffect` watching `game().hostId`)

#### Host Actions UI:
- Auto-submit and auto-judge buttons should only show for current host
- If previous host rejoins, hide host-only UI elements

---

### 6. Implementation Steps (Future Work)

**Phase 1: Presence System (High Priority)**
1. [ ] Add `PresenceDocument` interface to `src/types/game.ts`
2. [ ] Create `src/lib/firebase/presence.ts` with heartbeat logic
3. [ ] Add client-side heartbeat in game route (`onMount`)
4. [ ] Create Firestore subcollection `games/{gameId}/presence/{userId}`
5. [ ] Add Firestore rules for presence writes (user can only update their own)

**Phase 2: Handover Logic (High Priority)**
6. [ ] Add `hostHandoverHistory` field to `GameDocument`
7. [ ] Implement `hostHandoverAction` in `actions.ts`
8. [ ] Create host monitor effect in `GameBoard.tsx` (checks heartbeat every 5s)
9. [ ] Add handover trigger logic when host AFK detected

**Phase 3: UI/UX (Medium Priority)**
10. [ ] Add crown icon next to host in player list
11. [ ] Create handover notification toast component
12. [ ] Add "You are now host" banner component
13. [ ] Hide host-only actions for non-hosts

**Phase 4: Edge Case Hardening (Low Priority)**
14. [ ] Add handover rate limiting (Firestore rules)
15. [ ] Add recovery logic for "all players offline" scenario
16. [ ] Add analytics/logging for handover events
17. [ ] Test split-brain scenarios in E2E tests

**Phase 5: Optional - RTDB Hybrid Upgrade**
18. [ ] Deploy Cloud Function for RTDB -> Firestore mirroring
19. [ ] Replace heartbeat with RTDB `onDisconnect()`
20. [ ] Migrate existing games to new presence system

---

### 7. Testing Strategy

**Unit Tests**:
- `hostHandoverAction` transaction logic
- Host selection algorithm (oldest lastSeen)
- Edge case: all players offline
- Edge case: handover rate limiting

**E2E Tests** (Playwright):
1. Simulate host disconnect (close browser tab)
2. Verify new host auto-promoted within 20 seconds
3. Verify game continues (auto-submit/judge still works)
4. Verify original host rejoins as regular player
5. Verify crown icon updates in UI

---

### 8. Firestore Rules Updates

```javascript
// Allow players to update their own presence
match /games/{gameId}/presence/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}

// Host handover validation
match /games/{gameId} {
  allow update: if request.auth != null && (
    // Regular updates (existing rules)
    // ...
    
    // Host handover rules
    || (
      // Only change hostId if current host is AFK
      request.resource.data.hostId != resource.data.hostId &&
      // Verify timestamp difference >15s (server-side check needed)
      // Rate limit: handoverHistory.length < resource.data.handoverHistory.length + 1
    )
  );
}
```

---

### 9. Performance & Cost Considerations

**Heartbeat Cost**:
- 1 write per player per 5 seconds
- 4 players game, 10 minutes = 4 * (60/5) * 10 = **480 writes**
- Firestore free tier: 20K writes/day → ~41 games/day free

**Optimization**:
- Only send heartbeat if game is active (`status === 'playing' || status === 'judging'`)
- Stop heartbeat when player is idle for >1 minute (detect via `document.visibilityState`)

**RTDB Alternative**:
- RTDB presence is free (no per-write cost)
- But requires Cloud Functions deploy (complexity++)

---

### 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Network lag causes false AFK | Medium | High | Use 15s threshold (3x heartbeat interval) |
| Handover during critical action (judging) | Low | Medium | Handover is idempotent - new host can resume |
| Client clock skew affects heartbeat | Low | Low | Use `serverTimestamp()` for all time checks |
| Firestore rules too permissive | Medium | High | Add integration tests for rules |

---

### 11. Future Enhancements

- **Manual host transfer**: Allow current host to promote another player (e.g., if they need to leave)
- **Host rotation**: Auto-rotate host every N rounds (optional game setting)
- **Presence UI**: Show online/offline indicator for all players
- **Reconnection grace period**: If host disconnects <30s, don't handover (they might refresh page)

---

**Decision**: Proceed with client-side heartbeat presence system. Implement Phase 1 + Phase 2 first (core functionality), then iterate on UX and edge cases.

**Next Steps**:
- Create task `stab-9`: Implement presence heartbeat system
- Create task `stab-10`: Implement host handover transaction logic
- Create task `stab-11`: Add handover UI notifications

