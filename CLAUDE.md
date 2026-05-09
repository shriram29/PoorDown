# CLAUDE.md — PoorDown

## What this project is

PoorDown is a browser-based multiplayer Monopoly clone. Fully serverless — game state syncs P2P between players via Y.js + WebRTC (`y-webrtc`). Deploys to Vercel for free. No database, no paid backend.

Read `wiki/` for all context. Start with `wiki/README.md`.

---

## Key decisions (don't re-litigate these)

- **y-webrtc, not PartyKit** — PartyKit was the original plan but requires a paid server. y-webrtc is free P2P via WebRTC + free STUN servers. This was a deliberate decision.
- **No boardgame.io** — requires a persistent Node.js server, incompatible with Vercel free tier.
- **Host-authoritative** — the host's client runs game logic. Other players send intents. Host migrates to next-joined player on disconnect.
- **JavaScript, not TypeScript** — the codebase is JS. Don't convert to TS unless explicitly asked.
- **Pages Router** — using Next.js Pages Router (`pages/`), not App Router. Don't migrate.

---

## Current state (as of 2026-05-09)

The codebase is partially implemented. Several things are broken. Read `wiki/implementation-status.md` before touching any code.

**Biggest blockers:**
1. `y-webrtc` is NOT installed. `partykit`/`y-partykit`/`partysocket` are still in package.json — remove them, install `y-webrtc`.
2. `ydoc.getNumber()` and `ydoc.getBoolean()` are called throughout `state.js` — these don't exist in Y.js. Must be replaced with `ydoc.getMap('meta').get/set`.
3. No real multiplayer — `pages/room/[code].js` uses local Y.js only.
4. No identity system — no UUID/name localStorage flow yet.

---

## Architecture

```
pages/index.js          → Landing page (create/join room)
pages/room/[code].js    → Game room (main game view)
components/board/       → SVG board
components/hud/         → Player HUD, Action Bar
components/modals/      → Property modal (buy/auction)
components/lobby/       → Create/Join forms
lib/game/board.js       → Board data (complete, correct — don't modify)
lib/game/state.js       → Y.js state helpers (needs Y.js API fixes)
wiki/                   → All documentation
```

### Y.js schema
```
ydoc.getMap('meta')     → hostId, phase, currentPlayer, doublesCount, dice, gameOver, winner
ydoc.getArray('players')→ Player[] ordered by join time
ydoc.getMap('board')    → propertyId (string) → { owner, houses, mortgaged }
ydoc.getMap('config')   → game settings
awareness               → live presence (ephemeral)
```

Player object shape:
```js
{ uuid, name, color, cash, position, properties[], inJail, jailTurns, getOutOfJailFree, isEliminated, joinedAt }
```

---

## What to work on next

See `wiki/roadmap.md` Phase 1 for the ordered task list. The gating work is:
1. Replace PartyKit with y-webrtc
2. Fix Y.js API bugs
3. Identity system (name + UUID in localStorage)
4. Host management (election on disconnect)

---

## Code style

- JavaScript only (no TypeScript)
- No comments unless the WHY is non-obvious
- No trailing summaries in responses — the diff speaks for itself
- Inline styles are used throughout (not Tailwind classes in JSX) — keep that pattern consistent
- `nanoid` for all ID generation
- All game state reads/writes go through `lib/game/state.js` helpers, not direct Y.js calls in pages/components

---

## Running locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

No environment variables needed. No external services to run.

---

## Deploying

```bash
vercel
```

No partykit deploy step. No other services.
