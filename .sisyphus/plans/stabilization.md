# SES Game Stabilization Plan (Updated)

## Current Status
- **Framework**: SolidStart + Firebase + GSAP (Migration 100% Complete).
- **Core Loop**: Automated transitions (Host Auto-Action) implemented.
- **UI/UX**: Brand consistent (#ff4757 primary), zero-scroll viewport.
- **Mobile**: Snap-scroll hand implemented, but needs further UX refinement.

## Pending Tasks (Priority Order)

### 1. E2E Test Stabilization (CRITICAL)
- [x] **Fix '?' Mismatch**: The test expects 2 '?' (submissions) but finds 3 (one in prompt text). Fix selector to only target submission cards.
- [x] **State Sync Resilience**: Add better waiting logic for the "Pick Winner" button in `rigorous_multiplayer.spec.ts`.

### 2. UI/UX Reinvention
- [x] **Mobile Card Picking**: Redesign the card selection for small screens. Current snap-scroll is an improvement but still hard to see. Explore a vertical carousel or full-screen expansion.
- [x] **Deal Animation**: Staggered deal entrance is currently bugged/not triggering as expected. Fix logic in `GameBoard.tsx` effect.
- [x] **Mobile Judge View**: Ensure card reveal targets are large enough for fingers.

### 3. Polish & Logic
- [x] **Confetti Trigger**: Refine logic so *only* the actual round winner sees the confetti.
- [x] **Tie Handling**: Implement visual feedback for ties (no points awarded).
- [x] **AFK Host**: Plan for host handover if the original host disconnects.

---

## Instructions for Next Session
1. **Start Dev Server**: `bun dev`
2. **Run Tests**: `npx playwright test src/e2e/rigorous_multiplayer.spec.ts --project=chromium`
3. **Focus**: `GameBoard.tsx` for mobile UI and `rigorous_multiplayer.spec.ts` for test stabilization.
