# PoorDown — Architecture

## Overview

PoorDown is fully serverless. The frontend deploys to Vercel. Game state syncs P2P between all players via WebRTC data channels. No backend server handles game data — ever.

```
Player A (host)  ←──WebRTC──→  Player B
       ↕                            ↕
    WebRTC                       WebRTC
       ↕                            ↕
Player C  ←──────────WebRTC──────→ Player D
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | Next.js 14 (Pages Router, JS) | Vercel-native, file-based routing |
| Styling | Tailwind CSS v3 | Utility-first, fast iteration |
| Animation | Framer Motion | Spring physics, layout animations |
| Real-time sync | Y.js + y-webrtc | CRDT state, WebRTC transport |
| Icons | Lucide React | Consistent icon set |
| IDs | nanoid | Room codes + player UUIDs |
| Hosting | Vercel | Free tier, no config needed |

### Key packages
```json
{
  "yjs": "^13.6.0",
  "y-webrtc": "^10.x",
  "framer-motion": "^11.0.0",
  "nanoid": "^5.0.0",
  "next": "14.x",
  "react": "^18.3.0",
  "tailwindcss": "^3.4.0"
}
```

**Remove:** `partykit`, `y-partykit`, `partysocket` — these are replaced by `y-webrtc`.

---

## P2P Design (y-webrtc)

### How it works
1. Player opens room → `WebrtcProvider(roomId, ydoc)` connects to public signaling server
2. Signaling server (`wss://signaling.yjs.dev`) relays SDP handshake messages (no game data)
3. After handshake, direct WebRTC data channel established between peers
4. All Y.js updates flow over the data channel — no server involved
5. Signaling server can be dropped once peers are connected

### WebRTC config
```js
new WebrtcProvider(roomId, ydoc, {
  signaling: ['wss://signaling.yjs.dev'],
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ],
  maxConns: 8,
})
```

### Known limitation
Free STUN servers work for ~85% of network setups. Users on strict corporate/symmetric NAT (~15%) may fail to connect. TURN relay servers fix this but cost money. Accepted tradeoff for a friends game.

---

## Y.js Document Schema

All game state lives in a single Y.js document per room. The room ID is the room code prefixed with `poordown-`.

```
ydoc
├── getMap('meta')         → hostId, phase, currentPlayer, doublesCount, gameOver, winner, turnNumber
├── getArray('players')    → ordered array of Player objects (join order = host seniority)
├── getMap('board')        → propertyId (string) → PropertyState
├── getMap('config')       → game configuration set by host before start
├── getMap('cards')        → 'chance' → Card[], 'communityChest' → Card[]
└── awareness              → live presence (who's online, ephemeral)
```

### Meta map fields
```js
meta.get('hostId')         // string — UUID of current host
meta.get('phase')          // 'setup' | 'rolling' | 'moving' | 'buying' | 'auction' | 'jail' | 'gameOver'
meta.get('currentPlayer')  // number — index into players array
meta.get('doublesCount')   // number — 0, 1, or 2 (3rd double = jail)
meta.get('dice')           // [number, number]
meta.get('gameOver')       // boolean
meta.get('winner')         // string | null — player name
meta.get('turnNumber')     // number
```

> **Important:** Previous code used `ydoc.getNumber()` and `ydoc.getBoolean()` — these do NOT exist in Y.js. All scalar game state must live in a `Y.Map`.

### Player object (inside players Y.Array)
```js
{
  uuid: string,          // localStorage UUID — persistent identity, used for rejoin
  name: string,
  color: string,         // hex token color, assigned by join order
  cash: number,
  position: number,      // 0–39
  properties: number[],  // array of space IDs owned
  inJail: boolean,
  jailTurns: number,     // turns spent in jail (max 3)
  getOutOfJailFree: number, // count of GOOJF cards held
  isEliminated: boolean,
  joinedAt: number,      // timestamp — used for host election order
}
```

### PropertyState (in board Y.Map, keyed by space ID as string)
```js
{
  owner: string | null,  // player UUID
  houses: number,        // 0–4 = houses, 5 = hotel
  mortgaged: boolean,
}
```

### GameConfig (set by host pre-game)
```js
{
  startingCash: 1500,         // 1000 | 1500 | 2000 | 3000
  auctionEnabled: true,
  mortgageEnabled: true,
  freeParkingJackpot: 0,      // 0 | 100 | 500 (house rule)
  jailFine: 50,
  maxPlayers: 8,
}
```

---

## Player Identity

### First visit
1. Prompt: "What do we call you?" — modal, required
2. Generate UUID: `nanoid(21)`
3. Store in localStorage: `poordown_identity = { uuid, name }`
4. Name editable later from header

### Returning visit
- Skip prompt, read from localStorage
- Pre-fill name in create/join forms

### Rejoin detection
When a player connects to a room:
1. Read their UUID from localStorage
2. Check Y.js `players` array for matching UUID
3. If found → rejoin: restore their slot, mark presence in awareness
4. If not found → new player: add to players array

---

## Host System

### What the host does
- Sets game config (starting cash, house rules)
- Clicks "Start Game"
- Their client runs authoritative game logic (dice rolls, card draws, move validation)
- Other players' actions are validated against shared Y.js state

### Why host-authoritative
Pure CRDT (everyone writes freely) would allow any peer to modify any state. For a friends game this is fine in theory, but having the host validate moves prevents accidental conflicts when two events happen simultaneously (e.g., player tries to buy already-purchased property).

### Host storage
`meta.get('hostId')` stores the current host's UUID in the Y.js document. All peers can read who the host is.

### Host migration
Triggered when awareness reports a peer disconnect and that peer's UUID matches `meta.get('hostId')`.

**Election algorithm:**
1. Get remaining connected peers from awareness
2. Cross-reference with `players` array (sorted by `joinedAt` ascending)
3. First player in join order who is still connected becomes new host
4. That player writes their UUID to `meta.set('hostId', myUuid)`
5. To prevent write conflicts: only the player who would be elected writes — they check if the current `hostId` is still online first

### Rejoin after disconnect
- Player reconnects → their UUID is matched → they rejoin their slot
- They do NOT reclaim host status (promoted host keeps it)
- If game is in progress, they resume from current state

### All peers disconnect
- Y.js document lives in memory of all peers
- If all peers leave, state is lost — game cannot be resumed
- Acceptable: Monopoly games don't need persistent server-side saves

---

## Game Logic Architecture

All game logic runs client-side. The host's client is authoritative but all clients run the same logic for local rendering.

### File structure
```
lib/
└── game/
    ├── board.js      ← 40-space board data (complete, correct)
    ├── state.js      ← Y.js state read/write helpers (needs Y.js API fixes)
    ├── moves.js      ← Game move functions (rollDice, buyProperty, etc.) — TO CREATE
    ├── cards.js      ← Chance + Community Chest card decks — TO CREATE
    └── rent.js       ← Rent calculation logic — extract from state.js
```

### Turn flow
```
phase: 'rolling'
  → player clicks Roll
  → dice rolled (host authoritative if multiplayer)
  → player moved
  → space resolved:
      property (unowned)  → phase: 'buying'  → buy or auction
      property (owned)    → rent calculated + deducted automatically
      chance/community    → card drawn → effect applied
      tax                 → cash deducted
      goToJail            → sendToJail()
      jail (in jail)      → phase: 'jail' → pay/roll/use card
      go / freeParking    → no effect (free parking jackpot optional)
  → if doubles and not jailed: phase back to 'rolling' (roll again)
  → else: End Turn available
phase: 'gameOver'  (when activePlayers.length === 1)
```

---

## File Structure

```
poordown/
├── pages/
│   ├── _app.js                   ← App wrapper
│   ├── index.js                  ← Landing / lobby (create + join room)
│   └── room/
│       └── [code].js             ← Game room (main game view)
├── components/
│   ├── board/
│   │   └── Board.js              ← SVG board (all 40 spaces + player tokens)
│   ├── dice/
│   │   └── Dice.js               ← Dice component with roll animation
│   ├── hud/
│   │   ├── PlayerHUD.js          ← Per-player info card
│   │   └── ActionBar.js          ← Roll / Buy / Trade / End Turn buttons
│   ├── modals/
│   │   └── PropertyModal.js      ← Buy / Auction modal
│   ├── lobby/
│   │   ├── CreateRoom.js         ← Create room form
│   │   └── JoinRoom.js           ← Join room form
│   └── ui/
│       └── Modal.js              ← Generic modal wrapper
├── lib/
│   └── game/
│       ├── board.js              ← Board data (complete)
│       └── state.js              ← Game state helpers (needs Y.js fixes)
├── styles/
│   └── globals.css
├── public/
├── wiki/                         ← All documentation (you are here)
├── CLAUDE.md                     ← Agent instructions
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Environment Variables

No environment variables required for local dev or production. All sync uses public free infrastructure.

```env
# Optional: override signaling server (defaults to wss://signaling.yjs.dev)
NEXT_PUBLIC_SIGNALING_URL=wss://signaling.yjs.dev
```

---

## Deployment

```bash
# Install deps
npm install

# Dev
npm run dev        # http://localhost:3000

# Production build
npm run build
npm run start

# Deploy to Vercel
vercel             # or push to GitHub with Vercel integration
```

No other services need deploying. No partykit deploy step.
