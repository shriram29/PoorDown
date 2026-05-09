# PoorDown — PRD

## 1. Concept & Vision

**PoorDown** is an open-source, browser-based multiplayer Monopoly clone inspired by Richup.io. It runs entirely client-side for game logic, uses P2P or lightweight serverless infrastructure for real-time sync, and requires no database — rooms are created ad-hoc with shareable codes. The personality is nostalgic but modern: classic board game feel with crisp SVG visuals and smooth animations. The goal is to make a faithful Monopoly experience that anyone can join in seconds, fork, and deploy.

**Tagline:** *"The board game you know, anywhere you are."*

---

## 2. Design Language

### Aesthetic Direction
Mid-century modern meets flat design — think classic board game token aesthetics with clean, flat SVG pieces and muted backgrounds. Reference: a mix between vintage Parker Brothers artwork and modern flat UI (Linear/Figma level of polish).

### Color Palette
| Role | Hex | Usage |
|------|-----|-------|
| Board Green | `#2D6A4F` | Board background, land/safe spaces |
| Cream | `#F8F4E8` | Card backgrounds, UI surfaces |
| Player Red | `#E63946` | Player tokens, action buttons |
| Player Blue | `#1D3557` | Secondary player color, borders |
| Gold | `#F4A261` | Money, highlights, important UI |
| Dark | `#2B2D42` | Text, shadows, headers |
| Jail Orange | `#E76F51` | Jail / penalty spaces |
| Rail Gray | `#8D99AE` | Railroad properties |

### Typography
- **Headings:** `Playfair Display` — classic, editorial, board-game-box feel
- **Body / UI:** `Inter` — clean, modern, highly readable at small sizes
- **Monospace / Money:** `JetBrains Mono` — numbers, codes, prices

### Spatial System
- Base unit: `8px`
- Component padding: `16px` / `24px`
- Card border-radius: `12px`
- Board cell size: `64px` (responsive down to `48px` on mobile)

### Motion Philosophy
- **Dice roll:** CSS 3D transform with bounce easing (400ms)
- **Token movement:** Spring-based interpolation along board path (300ms)
- **Card reveal:** Slide-up with fade (200ms ease-out)
- **Turn transitions:** Subtle scale pulse on active player indicator
- **Property purchase:** Confetti burst on acquisition
- All animations respect `prefers-reduced-motion`

### Visual Assets
- **Board:** SVG-rendered, procedurally colored by property groups
- **Tokens:** SVG pawns in 8 distinct colors
- **Dice:** CSS 3D dice with dot faces
- **Cards:** Flat cards with subtle shadow, property-group color stripe on left
- **Money:** Flat illustrated bills with denomination
- **Icons:** Lucide React for UI chrome, custom inline SVG for game elements

---

## 3. Layout & Structure

### Main Views
1. **Lobby** — Create/join room, player name entry, bot selection
2. **Game Board** — Full monopoly board, player strips, action buttons
3. **Player HUD** — Current player info, dice, move history
4. **Property Modal** — Buy/auction/manage property overlay
5. **Trade Modal** — Player-to-player trade interface
6. **Settings** — Rule configuration (auctions, mortgage, starting cash, etc.)
7. **How to Play** — Rule reference / tutorial overlay

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│  Header: Room Code + Players + Settings        │
├─────────────────────────────────────────────────┤
│                                                 │
│              MONOPOLY BOARD                     │
│         (SVG, responsive, 16:16)                │
│                                                 │
├─────────────────────────────────────────────────┤
│  Player HUD: Current Turn + Dice + Actions     │
│  Action Bar: Roll / Buy / Trade / End Turn     │
└─────────────────────────────────────────────────┘
```

### Responsive Strategy
- **Desktop (>1024px):** Full board with side panels
- **Tablet (768-1024px):** Board fills width, HUD below
- **Mobile (<768px):** Vertical scroll, board scales, bottom sheet modals

### Board Layout
Standard Monopoly board (40 spaces) in clockwise spiral:
- Corner positions: GO, Jail, Free Parking, Go To Jail
- Inner track: 40 property/chance/community spaces
- Center: Dice area + action buttons

---

## 4. Features & Interactions

### Game Setup
- Host creates room → receives 6-character alphanumeric code
- Players join with code (no auth required — just a display name)
- Host configures rules before starting
- Bot players can be added (1-6 total players including bots)
- Game starts when host hits "Start Game"

### Core Gameplay

#### Turn Flow
1. **Roll dice** — Click/tap "Roll" button, animated dice roll
2. **Move** — Token animates along path to new position
3. **Land on space** — Auto-resolve: purchase, chance, community, tax, etc.
4. **Decision** — Buy property? Bid in auction? Pay rent? Draw card?
5. **End turn** — Pass to next player (or roll again if doubles)

#### Dice Mechanics
- Two six-sided dice with CSS 3D animation
- Doubles: player rolls again (max 3 consecutive, then jail)
- Player in jail: roll to escape (must get doubles or pay $50)

#### Property System
- **Purchase:** Land on unowned → buy modal appears → confirm/cancel
- **Auction:** If player declines, auction begins (all players bid)
- **Rent:** Landing on owned property → auto-deduct rent
- **Color sets:** Owning all of one color → can build houses/hotels
- **Mortgage:** Player can mortgage properties (half face value, no rent while mortgaged)
- **Unmortgage:** Pay face value + 10% interest

#### Trading
- Any two players can propose a trade
- Trade items: cash, properties, Get Out of Jail Free cards
- Both must accept for trade to execute
- Trading window always accessible during a player's turn

#### Bankruptcy
- Player owes more than they can pay → bankruptcy modal
- Can sell houses, mortgage properties, or trade to raise funds
- If still unable: all assets go to creditor, player eliminated
- Last player standing wins

### Bot Players
- 3 difficulty levels: **Easy** (random), **Medium** (basic strategy), **Hard** (optimal moves)
- Bots make decisions automatically after a configurable delay (3-10 seconds)
- Bot behavior: buy properties, build houses, pay rent, accept/reject trades

### Room System (Database-less)
- **No accounts, no persistence**
- Room state lives in Y.js / PartyKit server memory
- Room code = 6 alphanumeric chars (uppercase, no ambiguous chars: 0/O, 1/I/L)
- Room expires when all players leave (or after 30min inactivity)
- No match history, no leaderboards

### Rule Configuration (Host Options)
| Setting | Options |
|---------|---------|
| Starting Cash | $1000 / $1500 / $2000 / $3000 |
| Auction | On / Off |
| Mortgage | On / Off |
| Free Parking Jackpot | $0 / $100 / $500 |
| Jail Fines | Pay $50 / Pay $50 or roll doubles |
| Speed Die | On / Off |

### Interactions Detail

#### Dice Roll
- **Trigger:** Click "Roll" button (current player only)
- **Animation:** Dice tumble with physics (400ms), then settle
- **Doubles:** If doubles, "Roll Again" button appears
- **Jail:** If 3rd double, token moves to jail, turn ends

#### Property Purchase Modal
- **Trigger:** Land on unowned property
- **Content:** Property name, price, rent table, "Buy" / "Auction" / "Pass" buttons
- **Auction:** If "Auction" selected, all players enter bidding mode

#### Trade Modal
- **Trigger:** Click "Trade" button during your turn
- **Flow:** Select player → add items → send proposal → recipient accepts/declines
- **Animation:** Proposal card slides in, accept/decline with hover highlight

---

## 5. Component Inventory

### BoardSVG
- Full monopoly board with all 40 spaces
- Color-coded by property group
- Token positions animated along board path
- Hover state on properties (tooltip with name/price)
- Click state: select own properties to view/manage

### DiceComponent
- 3D CSS dice showing pip faces
- States: idle, rolling (animated), result (settled), doubles (highlighted)
- Click target only for current player

### PlayerToken
- SVG pawn, one of 8 colors
- States: normal, active (current turn, pulsing glow), eliminated (grayed/faded)
- Stacked on same cell with offset

### PropertyCard
- Full card with name, price, rent table, color stripe
- States: available, owned (grayed price), mortgaged (striped overlay), selected
- House/hotel indicators (0-4 houses: house icons, 1 hotel: hotel icon)

### ActionButton
- Primary (Roll), Secondary (Buy, Trade), Danger (Pay, Sell)
- States: enabled, disabled (grayed), loading (spinner)
- Hover: slight scale (1.02), shadow lift

### PlayerHUD
- Player name, avatar (colored pawn icon), cash amount
- Active state: highlight border + turn indicator
- Elimination state: crossed-out name, faded avatar

### Modal
- Centered overlay with backdrop blur
- Close on backdrop click or X button
- Slide-up animation on mobile

### MoneyDisplay
- Illustrated bill icons with denomination
- Animated count-up/down when money changes
- Red flash on payment, green flash on receipt

### RoomCodeDisplay
- Large 6-char code with copy button
- Share button opens native share or copies link

---

## 6. Technical Approach

### Framework & Stack
- **Frontend:** Next.js 14 (JavaScript, Pages Router)
- **Real-time Sync:** PartyKit + Y.js
- **Styling:** Tailwind CSS (as requested for rapid iteration)
- **Animation:** Framer Motion
- **SVG Rendering:** Custom React components + inline SVG
- **Hosting:** Vercel (frontend) + PartyKit (WebSocket server)
- **Source:** Public GitHub repo (MIT license)

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  Vercel                         │
│              Next.js Frontend                   │
│  - Lobby, Game Board, Modals, Animations        │
│  - Connects to PartyKit WebSocket              │
└─────────────────────────────────────────────────┘
                        │
                        │ WebSocket
                        ▼
┌─────────────────────────────────────────────────┐
│               PartyKit Server                   │
│  - Y.js document per room                      │
│  - Room state in memory (no DB)                │
│  - Player presence & awareness                 │
│  - Persists until all players leave            │
└─────────────────────────────────────────────────┘
```

### Game State (Y.js Document per Room)
```js
{
  players: Map<playerId, { name, color, cash, position, properties, inJail, isBot }>,
  board: Map<propertyId, { owner, houses, mortgaged }>,
  currentPlayer: number, // index
  phase: 'setup' | 'rolling' | 'moving' | 'buying' | 'auction' | 'trading' | 'bankruptcy',
  dice: [number, number],
  doublesCount: number,
  deck: { chance: [], community: [] },
  history: Move[], // for undo / display
  config: GameConfig,
}
```

### Move Validation (Client-side + Server-side)
- All game rules enforced in `moves/` directory
- Moves submitted to Y.js (CRDT conflict resolution handles race conditions)
- Server-side move validation as backup
- Monopoly-specific rules: rent calculation, building limits, bankruptcy, trading

### PartyKit Integration
- Each room = one PartyKit room
- Room ID = 6-char code (URL: `/room/[code]`)
- Y.js `y-partykit` provider connects client to server
- Server broadcasts state to all connected clients

### Bot Logic
- Separate `bots/` module with strategy functions
- Easy: random legal moves
- Medium: prioritize buying high-value properties, basic rent avoidance
- Hard: maximize expected value, trade strategically
- Bot moves injected as Y.js updates (same as human moves)

### File Structure
```
poordown/
├── pages/
│   ├── index.js          # Landing / lobby
│   ├── room/[code].js    # Game room
│   └── 404.js
├── components/
│   ├── board/            # BoardSVG, PropertySpace, PlayerToken
│   ├── dice/             # DiceComponent
│   ├── hud/              # PlayerHUD, ActionBar, MoneyDisplay
│   ├── modals/           # PropertyModal, TradeModal, AuctionModal, etc.
│   └── ui/               # Button, Modal, Card (shadcn-like primitives)
├── lib/
│   ├── game/
│   │   ├── moves/        # buyProperty, payRent, rollDice, trade, etc.
│   │   ├── rules/        # Monopoly rules validation
│   │   └── config.ts     # Default game config
│   ├── partykit/
│   │   ├── client.ts     # Y.js + partykit connection
│   │   └── server.ts     # PartyKit server (party/index.ts)
│   └── bots/             # Bot strategy implementations
├── styles/
│   └── globals.css
├── party/
│   └── index.ts          # PartyKit server entry point
├── public/
│   └── tokens/           # SVG token files
├── prd.md
├── SPEC.md
└── README.md
```

### Build & Deploy
1. Frontend: Vercel (auto-deploy from GitHub)
2. PartyKit: `npx partykit deploy` (separate, also from GitHub)
3. PartyKit can be linked to Vercel project for unified domain

### Open Source
- MIT License
- Public GitHub repo
- Contribution guidelines (PRs welcome, testing required)
- CI: GitHub Actions (lint + test + build check)

---

## 7. Out of Scope (v1)

- Account / authentication
- Persistent match history
- Leaderboards / rankings
- Mobile native apps
- Real-money transactions
- 3D board / VR
- AI opponent beyond 3 difficulty levels
- Sound effects / music
- Single-player vs AI only (all games require at least 2 connected players, or use bots)
- Save/load game mid-session
- Spectator mode (v1)

---

## 8. Success Metrics (v1)

- Game is playable start-to-finish (winner determined)
- All 40 board spaces function correctly
- Up to 6 players (human + bots) in one room
- Room creation and joining works via code sharing
- No runtime errors during normal gameplay
- Build passes on Vercel
- PartyKit server deploys and accepts connections