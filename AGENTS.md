# SES Game: SolidStart + Firebase + GSAP Guidelines

## Project Tech Stack

- **Framework**: SolidStart (SolidJS)
- **Runtime**: Bun
- **Styling**: Tailwind CSS 4
- **Animation**: GSAP + CSS 3D
- **Database/Auth**: Firebase (Firestore, Auth)
- **Testing**: Vitest + Solid Testing Library

## Essential Commands

- `bun dev`: Start development server
- `bun run build`: Build for production
- `bun start`: Start production server
- `bun run test`: Run tests with Vitest

## Directory Structure

- `src/routes/`: File-based routing (SolidStart)
- `src/components/`: Solid components
  - `ui/`: Primitives (Button, Input, etc.)
  - `game/`: Game-specific components (Card, Board)
- `src/lib/`: Business logic and utilities
  - `firebase/`: Firebase config and hooks
  - `animations/`: GSAP utilities
  - `game/`: Game state machine and rules
- `src/types/`: TypeScript definitions
- `data/`: Preserved static data (e.g., india.json)

## Coding Standards

### SolidJS Reactivity

- Use **Signals** (`createSignal`) for local state.
- Use **Resources** (`createResource`) for async data fetching.
- Use **Effects** (`createEffect`) for side effects.
- Avoid destructuring props (breaks reactivity). Use `props.name` or `splitProps`.
- Prefer `<Show>` and `<For>` over ternary/map for better performance.

### TypeScript

- Use strict typing. Avoid `any`.
- Define interfaces for all Firestore documents in `src/types/game.ts`.

### Firebase (solid-firebase)

- Use `useAuth(auth)` and `useFirestore(query)` from `solid-firebase`.
- Always wrap components using Firebase browser-only APIs in `clientOnly()` or dynamic imports in `onMount`.
- Follow the "claim-based dealing" strategy defined in `.sisyphus/plans/ses-rewrite.md`.

### Animations (GSAP)

- Register plugins (e.g., `Draggable`) in a dedicated `src/lib/animations/gsap.ts` file.
- Use `onMount` for initializing GSAP animations.
- Always clean up animations in `onCleanup` or use GSAP's own context management.

## Testing Patterns (TDD)

- Write tests in `*.test.ts` or `*.test.tsx` next to the implementation.
- Use pure mocks for Firebase and GSAP in unit tests.
- Verify component wiring in tests, visual correctness manually in `/test-*` routes.
