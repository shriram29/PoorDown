# PoorDown — Technical Specification

## Overview
PoorDown is a real-time multiplayer Monopoly clone. No database — room state lives in PartyKit server memory. Players join via 6-char room codes. All game logic runs client-side + Y.js CRDT sync via PartyKit.

---

## 1. Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 14 (Pages Router) | JavaScript |
| Styling | Tailwind CSS v3 | Utility-first |
| Animation | Framer Motion | React animations |
| Real-time | PartyKit + Y.js | WebSocket + CRDT |
| SVG | Inline React components | Board, tokens, cards |
| Icons | Lucide React | UI chrome |
| Hosting | Vercel (frontend) + PartyKit (WebSocket) | |

### Dependencies
```json
{
  "next": "14.x",
  "react": "18.x",
  "framer-motion": "10.x",
  "yjs": "13.x",
  "y-partykit": "0.0.x",
  "partysocket": "0.0.x",
  "lucide-react": "latest",
  "tailwindcss": "3.x",
  "nanoid": "3.x (for room codes)"
}
```

### Dev Dependencies
```json
{
  "@party/partykit": "0.0.x"
}
```

---

## 2. PartyKit Server Design

### Room Structure
Each PartyKit room = one game instance. Room ID = 6-char alphanumeric code.

### Y.js Document Schema
```ts
// Y.js shared types
players: Y.Array<Player>           // Ordered array of players
board: Y.Map<PropertyState>        // propertyId -> owner/houses/mortgaged
currentPlayerIndex: Y.Number
phase: Y.String                    // 'setup'|'rolling'|'moving'|'buying'|'auction'|'trading'|'bankruptcy'
dice: Y.Array<Number>              // [die1, die2]
doublesCount: Y.Number
deck: Y.Map<Card[]>                // 'chance' | 'communityChest'
config: Y.Map<GameConfig>
turnNumber: Y.Number
gameOver: Y.Boolean
winner: Y.String | null
```

### Player Schema
```ts
interface Player {
  id: string          // Y.js client ID
  name: string
  color: string       // token color hex
  cash: number
  position: number    // 0-39 (board position)
  properties: string[] // property IDs owned
  inJail: boolean
  jailTurns: number   // turns spent in jail
  getOutOfJailFree: boolean
  isBot: boolean
  botDifficulty?: 'easy' | 'medium' | 'hard'
  isEliminated: boolean
}
```

### PropertyState Schema
```ts
interface PropertyState {
  owner: string | null      // player ID
  houses: number            // 0-4 (5 = hotel)
  mortgaged: boolean
}
```

### GameConfig Schema (set by host)
```ts
interface GameConfig {
  startingCash: 1000 | 1500 | 2000 | 3000
  auctionEnabled: boolean
  mortgageEnabled: boolean
  freeParkingJackpot: 0 | 100 | 500
  jailFine: 'pay50' | 'rollDoubles'
  speedDie: boolean
  maxPlayers: 2 | 3 | 4 | 5 | 6
}
```

### PartyKit Server (`party/index.ts`)
```ts
// Responsibilities:
// 1. Create Y.js doc per room on connection
// 2. Sync Y.js updates to all connected clients
// 3. Handle player join/leave (update awareness)
// 4. Initialize game state if host creates new room
// 5. Broadcast player presence (awareness)
// 6. Clean up room when last player leaves

// No game logic here — all logic is client-side via Y.js
```

---

## 3. Game Logic (`lib/game/`)

### Board Data (`lib/game/board.ts`)
- Array of 40 space objects
- Each space: `{ id, name, type, price?, rent?, color?, group? }`
- Types: 'go' | 'property' | 'chance' | 'communityChest' | 'tax' | 'jail' | 'freeParking' | 'goToJail' | 'railroad' | 'utility'
- Property groups: Brown, LightBlue, Pink, Orange, Red, Yellow, Green, DarkBlue

### Moves (`lib/game/moves/`)

Each move is a pure function: `(G, ctx, ...args) => G`

| Move | Description |
|------|-------------|
| `rollDice` | Roll 2d6, set dice state, increment doubles if doubles |
| `movePlayer` | Move token from current position to new position |
| `buyProperty` | Player purchases landed property |
| `auctionProperty` | Run auction (highest bidder wins) |
| `payRent` | Deduct rent from player, credit owner |
| `drawCard` | Draw from chance or community chest deck |
| `goToJail` | Move player to jail, set inJail=true |
| `escapeJail` | Pay $50 or roll doubles to leave jail |
| `buildHouse` | Add house to property (if owns full set) |
| `sellHouse` | Remove house from property |
| `mortgage` | Mortgage a property (cash in, no rent) |
| `unmortgage` | Unmortgage a property (pay face + 10%) |
| `trade` | Exchange cash/properties between two players |
| `bankrupt` | Player eliminated, assets transferred |
| `endTurn` | Advance to next player |

### Rules (`lib/game/rules.ts`)

| Rule | Implementation |
|------|----------------|
| Rent calculation | Base rent × multiplier (with houses), double if owning full set |
| Building limits | Max 4 houses per property, must be uniform across color set |
| Doubles | Roll again, 3rd double = go to jail |
| Bankruptcy | Must sell houses/mortgage/trade to pay; if can't, assets to creditor |
| Trading | Both parties must confirm; no Get Out of Jail Free card trades |
| Jail | Stay up to 3 turns, pay $50 or roll doubles to escape |

### Bot AI (`lib/bots/`)

| Difficulty | Strategy |
|------------|----------|
| Easy | Random legal moves: buy if has cash, pay minimum rent, random building |
| Medium | Buy high-value properties, avoid bad trades, basic house building |
| Hard | Maximize expected value, optimal trading, track other players' cash |

Bot behavior: `setTimeout`-based with configurable delay (3-10s), injects moves via Y.js.

---

## 4. File Structure

```
poordown/
├── party/
│   └── index.ts              # PartyKit server (Y.js room handler)
├── pages/
│   ├── _app.js               # App wrapper, layout
│   ├── index.js              # Landing / lobby page
│   └── room/
│       └── [code].js         # Game room page
├── components/
│   ├── board/
│   │   ├── Board.js          # Main board SVG wrapper
│   │   ├── BoardSpace.js     # Individual space on board
│   │   ├── PropertyCard.js   # Full property card modal
│   │   └── PlayerToken.js    # SVG token component
│   ├── dice/
│   │   └── Dice.js           # 3D CSS dice component
│   ├── hud/
│   │   ├── PlayerHUD.js      # Player info strip
│   │   ├── ActionBar.js     # Roll, Buy, Trade, End Turn buttons
│   │   └── MoneyDisplay.js  # Animated money counter
│   ├── modals/
│   │   ├── PropertyModal.js  # Buy/auction modal
│   │   ├── TradeModal.js     # Trade proposal UI
│   │   ├── AuctionModal.js  # Auction bidding UI
│   │   ├── JailModal.js     # Jail escape options
│   │   ├── BankruptcyModal.js
│   │   └── ConfigModal.js   # Pre-game rule settings
│   ├── lobby/
│   │   ├── CreateRoom.js    # Create room form
│   │   └── JoinRoom.js      # Join with code form
│   └── ui/
│       ├── Button.js
│       ├── Modal.js
│       └── Card.js
├── lib/
│   ├── game/
│   │   ├── board.ts          # Board data (40 spaces)
│   │   ├── config.ts        # Default game config
│   │   ├── rules.ts         # Rule validators
│   │   └── moves/           # All game moves
│   ├── partykit/
│   │   ├── client.ts        # Y.js client setup
│   │   └── provider.ts      # PartyKit Y.js provider
│   └── bots/
│       └── index.ts          # Bot logic
├── styles/
│   └── globals.css           # Tailwind + custom CSS vars
├── public/
│   └── tokens/               # SVG token files (8 colors)
├── tailwind.config.js
├── next.config.js
├── partykit.json             # PartyKit config
├── SPEC.md
├── prd.md
└── README.md
```

---

## 5. Pages

### `/` — Landing / Lobby
- Hero with game title and tagline
- "Create Room" button → set name, configure rules, create room
- "Join Room" input → enter 6-char code + display name → join room
- Preview of the board art
- "How to Play" expandable section
- Links: GitHub, MIT License

### `/room/[code]` — Game Room
- Header: room code (copyable), player list with ready status
- Board: full SVG monopoly board, centered
- HUD: current player indicator, dice, action buttons
- Side panel (desktop): player strips, property list
- Modals: triggered by game events

---

## 6. Board Design

### SVG Board Layout
- 16:9 aspect ratio container, responsive
- 4 sides of board with 10 spaces each (clockwise)
- Corners: GO (bottom-left), Jail (top-left), Free Parking (top-right), Go To Jail (bottom-right)
- Center: dice area + game info
- Inner track: blank (for future use)
- Property spaces: colored rectangles with name, price below board edge
- Special spaces: icon + name (chance = ?, community = C, tax = $, railroad = 🚂, utility = 💡)

### Property Color Groups
| Group | Color | Properties |
|-------|-------|------------|
| Brown | `#8B4513` | Mediterranean Ave, Baltic Ave |
| LightBlue | `#87CEEB` | Oriental Ave, Vermont Ave, Connecticut Ave |
| Pink | `#FF69B4` | St. Charles Place, States Ave, Virginia Ave |
| Orange | `#FF8C00` | St. James Place, Tennessee Ave, New York Ave |
| Red | `#E63946` | Kentucky Ave, Indiana Ave, Illinois Ave |
| Yellow | `#FFD700` | Atlantic Ave, Ventnor Ave, Marvin Gardens |
| Green | `#228B22` | Pacific Ave, North Carolina Ave, Pennsylvania Ave |
| DarkBlue | `#1D3557` | Park Place, Boardwalk |
| Railroad | `#8D99AE` | Reading, Pennsylvania, B&O, Short Long |
| Utility | `#8D99AE` | Electric Company, Water Works |

### Token Positions
- Each token placed at its board position
- Tokens on same space: radial offset from center
- Active player token: pulsing glow effect

---

## 7. Component States

### Dice
- **idle:** Dice face visible, waiting for roll
- **rolling:** Tumbling animation (400ms)
- **result:** Settled face, if doubles: highlighted border + "Doubles!" label
- **disabled:** Grayed out when not current player's turn

### ActionButton
- **enabled:** Full color, clickable
- **disabled:** 50% opacity, cursor not-allowed
- **loading:** Spinner replaces text
- **primary/secondary/danger** variants

### PropertyCard Modal
- **available:** Buy button prominent, price shown
- **owned:** Grayed buy area, rent table shown, owner highlighted
- **auction:** Bid input, current bid displayed, timer optional
- **mortgaged:** Diagonal stripes overlay, "Mortgaged" label

### PlayerHUD
- **active:** Bright border, "Your Turn" badge
- **waiting:** Normal appearance
- **eliminated:** Crossed-out name, gray avatar, "Bankrupt" label

### RoomCode
- Large monospace font, letter-spaced
- Copy button with clipboard icon
- "Share" button opens `navigator.share()` on mobile

---

## 8. Real-time Flow

### Player Joins
1. Player opens `/room/[code]`
2. Client connects to PartyKit WebSocket
3. Y.js doc loaded (or created if empty)
4. Player added to `players` Y.Array with name + assigned color
5. All clients re-render player list

### Game Start (Host initiates)
1. Host clicks "Start Game"
2. `config` Y.Map populated with settings
3. `phase` set to 'rolling'
4. `currentPlayerIndex` set to 0
5. All clients transition to game view

### Turn Flow
1. Current player clicks "Roll"
2. Client calls `rollDice` move → Y.js updated
3. All clients see dice animate
4. After animation, `movePlayer` called
5. Board resolves landed space (trigger appropriate modal)
6. Player acts → moves applied via Y.js
7. "End Turn" → `endTurn` move → next player

### Bot Turn
1. Y.js `currentPlayer` set to bot index
2. `phase` set to 'botThinking'
3. Bot logic `setTimeout` fires after delay
4. Bot injects moves via Y.js (same as human)
5. Continue until bot ends turn

### Player Leaves
1. PartyKit detects WebSocket disconnect
2. Player marked as disconnected (awareness)
3. If bot: replace with new bot or pause game
4. If last player: room cleaned up after 30min

---

## 9. PartyKit Deployment

### `partykit.json`
```json
{
  "name": "poordown",
  "main": "party/index.ts",
  "compatibilityDate": "2023-11-01"
}
```

### Deploy Command
```bash
npx partykit deploy
```

### Vercel Integration
- PartyKit can be linked to Vercel project
- PartyKit URL: `https://poordown.[user].partykit.dev`
- Configured in `next.config.js` rewrites or env var

---

## 10. Environment Variables

```env
NEXT_PUBLIC_PARTYKIT_HOST=poordown.[user].partykit.dev
NEXT_PUBLIC_APP_URL=https://poordown.vercel.app
```

---

## 11. GitHub Actions CI

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

---

## 12. Implementation Priority

### Phase 1 — Core Board (MVP)
1. Next.js project setup + Tailwind
2. Board data + SVG board rendering
3. Dice component
4. Player tokens
5. Y.js + PartyKit setup
6. Basic turn flow (roll → move → buy)
7. Lobby (create/join room)
8. Bot players (easy mode)

### Phase 2 — Full Game
1. All 40 space mechanics (chance, community, tax, jail, etc.)
2. Rent system + color sets
3. House/hotel building
4. Trading
5. Bankruptcy
6. Win condition

### Phase 3 polish
1. All bot difficulties
2. Rule configuration UI
3. Animations + polish
4. How to Play tutorial
5. Mobile responsive

---

## 13. Open Issues / Decisions

| Item | Decision Needed |
|------|-----------------|
| Bot replacement | When a human leaves, bot takes over or game continues without them? |
| Disconnect timeout | How long before a disconnected player is replaced by a bot? |
| Host migration | If host disconnects, does another player become host? |
| Auction timer | Should auctions have a countdown timer? |
| Mobile UI | Is vertical scroll board acceptable or need pan/zoom? |
| Undo | Allow undo for misclicks? (Time-limited? Host-only?) |

These decisions will be finalized during Phase 1 implementation based on user feedback.
