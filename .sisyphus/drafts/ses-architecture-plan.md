# Draft: SES Game Complete Rewrite

## Decisions Confirmed

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend Framework** | SolidJS + SolidStart | Fine-grained reactivity, smaller bundles, React-like DX |
| **Backend** | Firebase (Auth, Firestore, RTDB) | Pricing flexibility, real-time built-in, no server management |
| **Runtime** | Bun | 3x faster than Node.js, native TypeScript, fast package installs |
| **3D/Animation** | CSS 3D Transforms + GSAP | 28KB bundle, 60fps mobile, perfect for card games |
| **Approach** | Delete everything, fresh start | Current code has multiple broken systems |
| **Testing** | TDD from beginning | Ensures quality, prevents regression |

## Animation Requirements (MVP)

All 6 animation features confirmed as must-haves:

| Animation | Library | Approach |
|-----------|---------|----------|
| **Card flip** | GSAP + CSS 3D | `rotateY(180deg)` with `transform-style: preserve-3d` |
| **Dealing sequence** | GSAP Timeline | Staggered animation from deck to hands |
| **Shuffle effect** | GSAP | Physics-based random movements |
| **Hover shake** | GSAP | Small rotation oscillation on hover |
| **Drag to play** | GSAP Draggable | Drag from hand to play area |
| **Particle effects** | tsParticles or canvas-confetti | Celebration, sparkles, glows |

### Bundle Impact
- GSAP Core: ~20KB
- GSAP Draggable: ~8KB
- tsParticles (particles): ~15KB
- **Total animation bundle**: ~43KB (still 2.5x lighter than Three.js)

## Tech Stack (Final)

| Layer | Technology | Bundle Size |
|-------|------------|-------------|
| Framework | SolidStart 1.x | ~15KB |
| UI | SolidJS + Tailwind CSS | ~10KB + utilities |
| State | Solid Signals + solid-firebase | ~5KB |
| Animation | GSAP + Draggable | ~28KB |
| Particles | tsParticles (lite) | ~15KB |
| Backend | Firebase (Auth, Firestore, RTDB) | ~45KB |
| Forms | @modular-forms/solid + Zod | ~10KB |
| Testing | Vitest + @solidjs/testing-library | Dev only |
| Runtime | Bun | N/A |

**Estimated Total Bundle**: ~130KB (vs ~250KB+ for Next.js + React)

## Project Structure (New)

```
src/
├── routes/                    # File-based routing (SolidStart)
│   ├── index.tsx             # Landing page
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (game)/
│   │   ├── create.tsx        # Create game
│   │   ├── join.tsx          # Join with code
│   │   └── [roomId].tsx      # Game room
│   └── api/                  # API routes
│       └── game/
├── components/
│   ├── game/
│   │   ├── Card.tsx          # 3D card with flip animation
│   │   ├── CardDeck.tsx      # Deck with dealing animation
│   │   ├── PlayerHand.tsx    # Draggable cards
│   │   ├── GameBoard.tsx     # Main game area
│   │   ├── PlayArea.tsx      # Drop zone for cards
│   │   └── ScoreBoard.tsx    # Scores with celebration particles
│   ├── ui/                   # Button, Input, Modal, etc.
│   ├── animations/           # GSAP animation utilities
│   │   ├── cardAnimations.ts # Flip, shake, deal
│   │   ├── particles.ts      # Celebration effects
│   │   └── useGSAP.ts        # SolidJS GSAP hook
│   └── layout/
├── lib/
│   ├── firebase/             # Firebase config & hooks
│   │   ├── config.ts
│   │   ├── auth.ts           # createAuthState hook
│   │   ├── firestore.ts      # createFirestoreDoc hook
│   │   └── game.ts           # Game-specific Firebase ops
│   ├── game/
│   │   ├── state.ts          # Game state signals
│   │   ├── rules.ts          # CAH game rules
│   │   └── cards.ts          # Card deck management
│   └── utils/
├── types/
│   ├── game.ts
│   ├── player.ts
│   ├── card.ts
│   └── animation.ts
├── styles/
│   ├── card.css              # 3D card CSS
│   └── animations.css        # Keyframe animations
└── test/
    └── setup.ts
```

## Key Features to Implement

### Phase 1: Foundation (Week 1)
1. SolidStart project setup with Bun
2. Tailwind CSS configuration
3. Firebase integration (config, auth hooks)
4. GSAP setup with SolidJS hook
5. AGENTS.md creation
6. Base UI components

### Phase 2: 3D Card System (Week 2)
1. Card component with CSS 3D structure
2. Card flip animation (GSAP)
3. Card hover/shake effects
4. Drag-to-play with GSAP Draggable
5. Deck component with dealing animation
6. Shuffle animation

### Phase 3: Authentication (Week 2-3)
1. Email/password auth
2. Google OAuth
3. Anonymous/guest login with Indian names
4. Protected routes
5. Auth context with Solid signals

### Phase 4: Game Core (Week 3-4)
1. Game creation & room codes
2. Lobby with real-time player list
3. Game state machine (Solid signals + Firestore)
4. Card distribution to players
5. Turn-based gameplay (CAH rules)
6. Judging and scoring

### Phase 5: Polish (Week 5)
1. Particle effects (celebrations, winner reveal)
2. Sound effects (optional)
3. Responsive design
4. Error handling & recovery
5. Performance optimization

## Scope Boundaries

### IN SCOPE (MVP)
- Complete SolidStart rewrite from scratch
- AGENTS.md with new stack guidelines
- All 6 animation features (flip, deal, shuffle, shake, drag, particles)
- Firebase integration (existing project)
- Core CAH gameplay
- Authentication (email, Google, anonymous)
- Real-time multiplayer
- TDD test coverage
- Responsive design

### OUT OF SCOPE (Future)
- Custom card deck creation
- AI commentary
- Leaderboards/progression
- Social features (friends, invites)
- Localization
- Premium/monetization
- Sound effects (nice-to-have, not blocking)

## Clearance Checklist
- [x] Core objective clearly defined? YES - Complete rewrite to SolidStart + Firebase + GSAP
- [x] Scope boundaries established? YES - IN/OUT defined above
- [x] No critical ambiguities? YES - All tech decisions made
- [x] Technical approach decided? YES - SolidStart + Firebase + GSAP + TDD
- [x] Test strategy confirmed? YES - TDD with Vitest from start
- [x] No blocking questions? YES - Ready to generate plan

## Ready for Plan Generation
All requirements clear. Proceeding to Metis consultation and work plan creation.
