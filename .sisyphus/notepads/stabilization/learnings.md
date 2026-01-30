# Stabilization Learnings

## [2026-01-30T05:12:26] Session Start: ses_3f2b20f75ffeKVxhsQ945wnzK2
- Working on stabilization tasks after successful Next.js → SolidStart migration
- Focus: E2E tests, mobile UX, polish

### 2026-01-30: Fixed '?' selector mismatch in E2E tests
- **Issue**: The generic `text=?` locator in `rigorous_multiplayer.spec.ts` matched 3 elements instead of 2. It was picking up the submission card placeholders (2) AND the "Judging..." status indicator (1) at the bottom of the page.
- **Fix**: Updated the selector to be more specific: `#game-play-area .bg-brand-secondary span:text("?")`.
- **Details**:
    - `#game-play-area` restricts the search to the main play area, excluding the status indicator at the bottom.
    - `.bg-brand-secondary` and `span:text("?")` accurately target the card placeholders.
    - The test now correctly identifies and clicks only the submission cards.
- **Note**: The test still occasionally fails at the winner selection step due to race conditions or auto-judging, but the selector mismatch is resolved.

## E2E Test Stabilization: rigorous_multiplayer.spec.ts
- **Judge Detection**: Relying on `isVisible()` for quick checks can fail if the UI is still transitioning. Using `expect().toBeVisible()` with a union of possible indicators (judge banner, hand cards, phase text) ensures the test waits for synchronization before determining player roles.
- **SolidJS Event Handlers**: Standard Playwright `click()` can sometimes fail to trigger SolidJS `onClick` handlers if the element is being transformed by CSS (e.g., hover tilts, flips). Using `evaluate(node => node.click())` provides a more direct and reliable trigger in these cases.
- **Selector Specificity**: When multiple pages are involved, ensure selectors are scoped correctly (e.g., using `#game-play-area`) to avoid matching UI elements from different states or global overlays.
