# Future Features Roadmap - Terrible Cards

## Current Status (Post-Stabilization)
- ✅ Core gameplay fully functional
- ✅ Real-time multiplayer with Firebase
- ✅ Mobile-optimized UI/UX
- ✅ E2E tests passing
- ✅ GSAP animations working

---

## Phase 1: Immediate Enhancements (2-3 weeks)

### 1.1 AFK Host Handover (HIGH PRIORITY)
**Status**: Planned (see `.sisyphus/notepads/stabilization/decisions.md`)  
**Effort**: 5-7 days  
**Why**: Prevents game stalls when host disconnects

**Tasks**:
- [ ] Implement Firebase Realtime Database presence detection
- [ ] Create heartbeat mechanism for all players
- [ ] Implement atomic host transfer on disconnect
- [ ] Add UI notification for host change
- [ ] Handle edge cases (rejoins, multiple disconnects)
- [ ] E2E tests for handover scenarios

### 1.2 Game History & Stats
**Effort**: 3-4 days  
**Why**: Player engagement and retention

**Features**:
- [ ] Personal stats dashboard (games played, win rate, favorite cards)
- [ ] Match history with timestamps
- [ ] Leaderboard (optional, can be Phase 2)
- [ ] Card play frequency analytics

### 1.3 Enhanced Mobile Experience
**Effort**: 2-3 days  
**Why**: Mobile is primary platform

**Tasks**:
- [ ] Add haptic feedback on card selection (vibration API)
- [ ] Implement swipe gestures for card browsing
- [ ] Add "quick play" shortcut for returning players
- [ ] Optimize font sizes for small screens (< 375px)

---

## Phase 2: Social & Content (3-4 weeks)

### 2.1 Custom Deck Creation
**Effort**: 1 week  
**Why**: User-generated content drives engagement

**Features**:
- [ ] Deck editor UI (create black/white cards)
- [ ] Deck sharing (public/private links)
- [ ] Community deck library
- [ ] Import/export deck JSON
- [ ] Moderation system for public decks

### 2.2 In-Game Chat
**Effort**: 4-5 days  
**Why**: Social interaction enhances fun

**Features**:
- [ ] Text chat during game
- [ ] Emoji reactions to cards
- [ ] Chat moderation (profanity filter)
- [ ] Chat history per game session
- [ ] Mute/block functionality

### 2.3 Friend System
**Effort**: 5-6 days  
**Why**: Encourages repeat play with same groups

**Features**:
- [ ] Friend requests and management
- [ ] Friend-only games (private lobbies)
- [ ] Invite friends to active game
- [ ] Online/offline status indicators
- [ ] Recent players list

---

## Phase 3: Monetization & Premium (4-5 weeks)

### 3.1 Premium Features (Optional)
**Effort**: 1-2 weeks  
**Why**: Revenue generation

**Features**:
- [ ] Premium deck packs ($1.99 each)
- [ ] Custom avatars/profile themes
- [ ] Ad-free experience
- [ ] Priority game hosting (faster servers)
- [ ] Advanced stats and analytics

### 3.2 Tournament Mode
**Effort**: 2 weeks  
**Why**: Competitive players, engagement

**Features**:
- [ ] Bracket-style tournaments (8/16 players)
- [ ] Scoring system across multiple games
- [ ] Tournament leaderboards
- [ ] Trophy/badge system
- [ ] Spectator mode

---

## Phase 4: Performance & Scale (2-3 weeks)

### 4.1 Performance Optimizations
**Effort**: 1 week  
**Tasks**:
- [ ] Implement lazy loading for routes
- [ ] Add service worker for offline play
- [ ] Optimize Firebase reads (pagination, caching)
- [ ] Image optimization (WebP, lazy loading)
- [ ] Bundle size analysis and reduction

### 4.2 Analytics & Monitoring
**Effort**: 3-4 days  
**Tasks**:
- [ ] Setup Firebase Analytics
- [ ] Error tracking (Sentry or Firebase Crashlytics)
- [ ] Performance monitoring (Core Web Vitals)
- [ ] User behavior tracking (heatmaps)
- [ ] A/B testing framework

### 4.3 SEO & Marketing
**Effort**: 3-4 days  
**Tasks**:
- [ ] Meta tags and Open Graph
- [ ] Landing page optimization
- [ ] Sitemap generation
- [ ] Social media preview cards
- [ ] App Store / Play Store listings (if going native)

---

## Phase 5: Advanced Features (Long-term)

### 5.1 AI Players
**Effort**: 2-3 weeks  
**Why**: Solo play when friends unavailable

**Features**:
- [ ] AI judge (picks funniest card)
- [ ] AI players (submit cards)
- [ ] Difficulty levels (random vs context-aware)
- [ ] Training data from real games

### 5.2 Sound Effects & Music
**Effort**: 1 week  
**Features**:
- [ ] Card flip sounds
- [ ] Winner celebration sounds
- [ ] Background music (mute option)
- [ ] Sound preference settings

### 5.3 Accessibility
**Effort**: 1-2 weeks  
**Features**:
- [ ] Screen reader support (ARIA labels)
- [ ] Keyboard navigation
- [ ] High contrast mode
- [ ] Font size controls
- [ ] Color blind friendly palette

---

## Maintenance & Operations (Ongoing)

### Continuous Tasks
- [ ] Security audits (Firestore rules, auth)
- [ ] Dependency updates
- [ ] Bug fixes and user feedback
- [ ] Content moderation
- [ ] Performance monitoring
- [ ] Cost optimization (Firebase usage)

---

## Priority Matrix

| Phase | Feature | Priority | Impact | Effort |
|-------|---------|----------|--------|--------|
| 1 | AFK Host Handover | 🔴 HIGH | HIGH | Medium |
| 1 | Game History | 🟡 MEDIUM | HIGH | Low |
| 1 | Mobile Enhancements | 🟡 MEDIUM | MEDIUM | Low |
| 2 | Custom Decks | 🟡 MEDIUM | HIGH | High |
| 2 | In-Game Chat | 🟢 LOW | MEDIUM | Medium |
| 2 | Friend System | 🟢 LOW | HIGH | Medium |
| 3 | Premium Features | 🟢 LOW | MEDIUM | High |
| 3 | Tournament Mode | 🟢 LOW | MEDIUM | High |
| 4 | Performance Opts | 🟡 MEDIUM | MEDIUM | Medium |
| 4 | Analytics | 🟡 MEDIUM | HIGH | Low |
| 5 | AI Players | 🟢 LOW | LOW | Very High |
| 5 | Sound Effects | 🟢 LOW | LOW | Medium |

---

## Recommended Next Steps

1. **Immediate** (This week):
   - Deploy to Firebase Hosting (see deployment guide)
   - Start AFK host handover implementation
   
2. **Short-term** (Next 2 weeks):
   - Complete Phase 1 features
   - Gather user feedback
   
3. **Medium-term** (Next month):
   - Evaluate which Phase 2 features to prioritize based on usage
   - Begin custom deck creation if user demand is high

4. **Long-term** (3+ months):
   - Consider monetization options
   - Evaluate mobile app (React Native wrapper or PWA)
