# Architectural Decisions

## Test Strategy
- Using Playwright for E2E multiplayer tests
- Test file: `src/e2e/rigorous_multiplayer.spec.ts`

## Animation Strategy
- GSAP for card animations
- Deal animation should trigger via createEffect watching hand changes
