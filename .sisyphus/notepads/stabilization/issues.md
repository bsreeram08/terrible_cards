# Known Issues

## E2E Test Issues
- '?' selector catches 3 elements instead of 2 (includes "Judging..." text at GameBoard.tsx:671)
- Pick Winner button timing - needs better state sync waiting

## UI/UX Issues
- Deal animation not triggering properly (GameBoard.tsx:189-206)
- Mobile card picking hard to see with current snap-scroll
- Mobile judge view touch targets too small

## Logic Issues
- Confetti triggers on submission, not just for winner
- No tie handling visual feedback
- No AFK host handover mechanism
