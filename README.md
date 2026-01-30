# Terrible Cards

Terrible Cards — Compact SolidStart + Firebase multiplayer card game with GSAP animations.

- Framework: SolidStart (SolidJS)
- Runtime: Bun
- Styling: Tailwind CSS
- Animations: GSAP + CSS 3D
- Backend/Auth: Firebase (Firestore, Auth)
- Testing: Vitest + Solid Testing Library

## Quick Commands

- Start dev server: `bun dev`
- Build: `bun run build`
- Start (prod): `bun start`
- Run tests: `bun run test`

## Repo layout (high level)

- `src/` — SolidStart app (routes, components, lib)
  - `src/components/` — UI + game components
  - `src/lib/firebase/` — Firebase setup and helpers
  - `src/lib/animations/` — GSAP helpers
  - `src/game/` — game rules/state/actions
- `data/` — static card decks
- `firebase.json`, `firestore.rules`, `firestore.indexes.json` — Firebase config
- `.sisyphus/` — planning notes and migration docs

## Environment / Secrets

- Client config is read from Vite env vars (prefixed `VITE_`). Example keys used in code: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc.
- Do NOT commit `.env` files. `.gitignore` includes `.env*` by default.
- Keep any Firebase Admin/service-account secrets out of the repo and in a secure secret manager. If admin secrets were ever committed, rotate them immediately and purge history.

## Security checklist (recommended)

- Ensure no `.env` or credential files are tracked: `git ls-files | grep -E "\.env"`
- Scan git history for secrets with `gitleaks detect --source .` or `gitleaks detect --source . --report-path=gitleaks-report.json`
- If secrets are found, remove using `git filter-repo` or BFG and rotate keys in provider consoles.

## Testing & Local Emulators

- Firebase emulators configured in `firebase.json` (auth on `9099`, firestore on `8080`).
- Use `VITE_USE_EMULATOR=true` locally to connect to emulators.

## Notes from AGENTS.md / Project guidance

- Follow SolidJS reactivity: use Signals/Resources/Effects and avoid props destructuring that breaks reactivity.
- Keep Firebase client config in `VITE_*` env vars; server-only Admin secrets must never be committed.
- Register GSAP plugins in `src/lib/animations/gsap.ts` and initialize/cleanup animations using lifecycle hooks.
- Write tests next to implementations and mock Firebase/GSAP in unit tests.

## Contributing

- Create a branch per feature: `git checkout -b feat/your-feature`
- Run tests locally before opening PR: `bun run test`
- Keep sensitive values out of commits; add `.env.example` with placeholders.

## Contact

For repo-level questions, check the `.sisyphus` notes or reach out to the maintainers via the project GitHub.
