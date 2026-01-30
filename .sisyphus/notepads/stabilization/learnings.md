## SolidJS + GSAP Integration
- **Client-Only Imports**: GSAP and other browser-only libraries must be imported dynamically inside `onMount` or `createEffect` to avoid SSR issues.
- **Ref Handling**: For conditionally rendered elements (e.g., inside `<Show>`), use a signal-based ref (`ref={setRefSignal}`) instead of a variable (`ref={refVar}`). This ensures effects dependent on the ref are re-triggered when the element mounts.
- **Style Conflicts**: If SolidJS manages `style={{ transform: ... }}` and GSAP animates the same properties, avoid `clearProps: "all"` in GSAP. This prevents GSAP from stripping the reactive styles at the end of the animation.

## Staggered Deal Animation Fix
- **Issue**: Deal animation wasn't triggering because `handContainerRef` was undefined or stale when the effect ran, and `gsap.from` with `clearProps: "all"` was removing SolidJS-managed inline styles (fan layout) after animation.
- **Fix**:
  - Converted `handContainerRef` to a signal (`[handContainer, setHandContainer]`) to make the ref reactive.
  - Updated `createEffect` to depend on `handContainer()`, ensuring it runs only when the container is mounted.
  - Removed `clearProps: "all"` from `dealCards` GSAP animation to preserve the fan layout `transform` applied by SolidJS.
- **Learning**: When mixing GSAP `from` animations with SolidJS reactive styles, avoid `clearProps: "all"` if the element relies on inline styles for its final state. Also, use signal refs for conditionally rendered elements to ensure effects have access to the DOM node.

## Deal Animation Verification (Task stab-3)

Verified the deal animation fix using Playwright automation and MutationObserver.

### Findings:
- **Animation Trigger**: The animation correctly triggers at the start of each round when cards are dealt.
- **Initial State**: Cards correctly start from off-screen (`translate(200px, -500px)`), rotated 45 degrees, and at 0 opacity.
- **Stagger Effect**: Confirmed sequential card dealing with a ~100ms (0.1s) stagger between each card's animation start.
- **Easing**: Smooth transition to the final fan layout using GSAP's `back.out` easing.
- **Stability**: No GSAP-related errors were found in the game flow console logs. The "target not found" warning in the test route was identified as a test-specific ref issue and doesn't affect the core game.
- **Layout**: Final card positions match the expected fan layout and are correctly contained within the play area.

### Evidence:
- Verification script (`verify_deal.ts`) captured the state transitions of individual cards.
- Screenshots confirmed the transition from empty hand to fully dealt fan layout.

## Touch Target Optimization (Judging Phase)
- **Problem**: Submission cards in the judging phase were 32x44 (8rem x 11rem) on mobile, which is decently large (128x176px) but the gap was loose (`gap-6`) and touch feedback was minimal.
- **Solution**:
  - Increased mobile card size to `!w-36 !h-52` (matching player hand cards).
  - Reduced container gap to `gap-4` on mobile to fit 2 columns on small screens (iPhone SE).
  - Added `p-2` padding to the clickable wrapper div to extend the hit area beyond the visual card boundary.
  - Added `hover:bg-gray-100/50 active:bg-gray-200/50` and `rounded-xl` to the wrapper for immediate visual feedback on touch, even if the user misses the card slightly but hits the wrapper.
- **Result**: "Fat finger" friendly interaction without compromising layout density.

## Confetti Trigger Refinement (2026-01-30)
- **Pattern**: Move event-based animations (like confetti) to state-driven effects (`createEffect`) to ensure consistency and prevent redundant triggers.
- **Decision**: Removed imperative confetti calls from `handleSubmitCards` and `handleWinnerSelect`.
- **Reasoning**: To satisfy the requirement that *only* the round winner sees confetti, the trigger must be tied to the state (`round.winnerId`) and the current user's identity, rather than the action that causes the state change (which might be performed by a different user, e.g., the judge).
