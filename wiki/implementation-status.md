# PoorDown — Implementation Status

Last updated: 2026-05-09

---

## What Exists

### Infrastructure
- [x] Next.js 14 project (Pages Router, JavaScript)
- [x] Tailwind CSS configured
- [x] Framer Motion installed
- [x] `nanoid` installed
- [x] `yjs` installed
- [ ] `y-webrtc` — NOT installed (still has `partykit`, `y-partykit`, `partysocket` — remove these, install `y-webrtc`)

### Game Data
- [x] `lib/game/board.js` — Complete. All 40 spaces with correct rent tables, house prices, groups, colors. Exported as `BOARD_SPACES`, `GROUP_COLORS`, `PLAYER_COLORS`, `DEFAULT_CONFIG`.

### Game Logic (`lib/game/state.js`)
- [x] Player CRUD: `addPlayer`, `removePlayer`, `getPlayer`, `getPlayerById`
- [x] Movement: `movePlayer`, `updatePlayerPosition` (pass-GO detection exists)
- [x] Cash: `updatePlayerCash`, `setPlayerCash`
- [x] Properties: `addPropertyToPlayer`, `removePropertyFromPlayer`, `setPropertyOwner`, `getPropertyState`, `setPropertyHouses`, `setPropertyMortgaged`
- [x] Transactions: `buyProperty`, `sellHouse`, `mortgageProperty`, `unmortgageProperty`
- [x] Jail: `sendToJail`, `escapeJail`
- [x] Rent: `calculateRent` (properties, railroads, utilities)
- [x] Color sets: `ownsColorSet`, `canBuildHouse`
- [x] Turn: `endTurn`, `setCurrentPlayer`, `setPhase`
- [x] Win: `checkWin`, `eliminatePlayer`, `getActivePlayers`
- [ ] Card deck draw logic — NOT implemented
- [ ] Trade logic — NOT implemented
- [ ] Auction logic — NOT implemented (stub only)

**CRITICAL BUG:** `state.js` calls `ydoc.getNumber()` and `ydoc.getBoolean()` throughout — these methods do not exist in Y.js. All scalar state (`currentPlayer`, `doublesCount`, `gameOver`) must be moved to `ydoc.getMap('meta')`. This will require rewriting the affected functions.

### Pages
- [x] `pages/index.js` — Landing page with Create Room / Join Room cards. Looks polished. Works for navigation.
- [x] `pages/room/[code].js` — Game room page. Has full UI layout but multiplayer is faked (local Y.js only, no WebRTC). Has most game logic wired up for single-player testing.

### Components
- [x] `components/board/Board.js` — SVG board renders all 40 spaces + player tokens. Has a corner position bug (see below).
- [x] `components/dice/Dice.js` — Dice component with rolling animation support.
- [x] `components/hud/PlayerHUD.js` — Player info card.
- [x] `components/hud/ActionBar.js` — Action buttons (Roll, Buy, Auction, Trade, End Turn, Start Game). Phase-aware.
- [x] `components/modals/PropertyModal.js` — Buy/Auction modal. Auction button is a stub (closes modal, no logic).
- [x] `components/ui/Modal.js` — Generic modal wrapper.
- [x] `components/lobby/CreateRoom.js` — Create room form. Generates 6-char code, navigates to room.
- [x] `components/lobby/JoinRoom.js` — Join room form. Takes name + code, navigates to room.

---

## Known Bugs

### 1. Y.js API misuse (CRITICAL)
`ydoc.getNumber()` and `ydoc.getBoolean()` are called throughout `state.js` and `pages/room/[code].js`. These don't exist. All scalar state must use `ydoc.getMap('meta').get(key)` / `.set(key, value)`.

Affected functions in `state.js`:
- `initGame` — calls `ydoc.getNumber('doublesCount')`, `ydoc.getNumber('currentPlayer')`, `ydoc.getBoolean('gameOver')`
- `rollDice` — calls `ydoc.getNumber('doublesCount')`
- `setCurrentPlayer` — calls `ydoc.getNumber('currentPlayer', index)` (wrong API, does nothing)
- `endTurn` — same
- `setGameOver` — calls `ydoc.getBoolean('gameOver', true)`

### 2. Board corner positions (VISUAL BUG)
`getCornerPosition()` in `Board.js` maps corners 10, 20, 30 incorrectly — corners 10, 20, 30 are all mapped to the same bottom-left position (same logic as corner 0). They overlap. Correct positions:
- Corner 0 (GO): bottom-right `{ x: WIDTH - CORNER_SIZE, y: HEIGHT - CORNER_SIZE }`
- Corner 10 (Jail): bottom-left `{ x: 0, y: HEIGHT - CORNER_SIZE }`
- Corner 20 (Free Parking): top-left `{ x: 0, y: 0 }`
- Corner 30 (Go To Jail): top-right `{ x: WIDTH - CORNER_SIZE, y: 0 }`

Also the space position calculations for bottom row start at id=1 but should account for id=0 being a corner. The indexing for non-corner spaces on each side needs audit.

### 3. No real multiplayer
`pages/room/[code].js` has a comment: "For MVP, simulate a WebSocket connection with local state." The Y.js document is local only — not connected to any WebRTC provider. No actual P2P sync exists yet.

### 4. PartyKit server is broken
`party/index.js` references `Y` before the import statement, would throw a runtime error. Also the Y.js update handling is incorrect. This file should be deleted — we're not using PartyKit.

### 5. No identity system
There is no UUID/name localStorage flow. The player name is taken from the URL query string (`?name=...`) each time. No persistent identity, no rejoin detection.

### 6. Auction is a stub
The auction button in `ActionBar` and `PropertyModal` fires `onAuction` which just closes the modal. No auction bidding UI or logic exists.

### 7. No card decks
Chance and Community Chest spaces render on the board but drawing a card does nothing. No card definitions or draw logic implemented.

### 8. No trading
Trade button exists in ActionBar but `onTrade` is not wired up in the room page. No trade UI or logic.

### 9. Jail logic incomplete
`sendToJail` and `escapeJail` exist in state.js but in the room page, when a player lands on "Go To Jail" (space 30), the code doesn't call `sendToJail`. The jail turn counter and "roll doubles to escape" mechanic are placeholders.

---

## What Needs to Be Built

### Highest priority (blocks everything)
1. **Install `y-webrtc`, remove PartyKit packages**
2. **Fix Y.js API** — move all scalar state to `ydoc.getMap('meta')`
3. **Wire up WebrtcProvider** in `pages/room/[code].js`
4. **Identity system** — name + UUID in localStorage, first-visit prompt
5. **Host management** — `hostId` in meta, host election on disconnect

### Core game completion
6. Fix board corner positions
7. Implement all space landing effects (jail, go to jail, tax, chance/community chest)
8. Implement card decks (Chance + Community Chest)
9. Implement auction flow
10. Implement trading
11. Implement bankruptcy flow (forced sell → transfer assets)
12. Implement jail turn handling (pay/roll/card options)

### Polish
13. Animated token movement (spring along board path)
14. Mobile layout
15. Pre-game config modal
16. Reconnect/rejoin UX feedback
