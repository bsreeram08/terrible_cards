# Fix Game Navigation and Verify

## Core Objectives
1. Fix the issue where players are not redirected to the game board when the host starts the game.
2. Verify all real-time listeners are functioning.
3. Fix any visual UI regressions.
4. Verify end-to-end flow.

## Implementation Plan

### 1. Fix GameLobby Navigation
The `GameLobby.tsx` component is missing a reactive effect to watch for the game status changing to "playing".

**File**: `src/components/game/GameLobby.tsx`
**Action**: Add `createEffect` to watch `game()?.status`.

```typescript
// Add imports: createEffect
import { createSignal, createMemo, onMount, onCleanup, For, Show, createEffect } from "solid-js";

// Inside GameLobby component:
createEffect(() => {
  if (game()?.status === "playing" && !isServer) {
    window.location.href = `/game/${params.gameId}/play`;
  }
});
```

### 2. Verify GameBoard Listeners
Ensure `GameBoard.tsx` is correctly listening to `round` updates.
The `useGameState` hook in `src/lib/game/state.ts` has been verified to have the round listener.
Ensure `GameBoard` uses `round()` signal reactively.

### 3. Fix "Page Broken" Issues
If the page appears broken, check:
- `PlayArea` layout (CSS/Tailwind)
- `Card` rendering
- `DraggableCard` interactions

**Specific Check**: Ensure `PlayArea` correctly handles empty states.
If `round` is null, `PlayArea` might be empty. Add a loading state or "Waiting for round to start" message if game is playing but round is missing.

### 4. E2E Verification
Run the Playwright tests to confirm the fix.

```bash
npx playwright test src/test/e2e.test.ts
```

## Next Steps
Run `/start-work` to execute this plan.
