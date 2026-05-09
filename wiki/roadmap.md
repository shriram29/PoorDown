# PoorDown — Roadmap

## Phase 1 — Make Multiplayer Real

Everything in this phase is blocked until multiplayer works. Do these in order.

### 1.1 Package cleanup
- Remove: `partykit`, `y-partykit`, `partysocket`
- Install: `y-webrtc`
- Delete: `party/index.js`, `partykit.json`

### 1.2 Identity system
- On first visit to `/`: show "What do we call you?" modal (cannot dismiss)
- Generate `nanoid(21)` UUID, store `poordown_identity = { uuid, name }` in localStorage
- Pre-fill name in create/join forms on return visits
- Show name in header with small edit button

### 1.3 Fix Y.js API
- All `ydoc.getNumber()` / `ydoc.getBoolean()` calls → `ydoc.getMap('meta').get/set`
- Rewrite `initGame()` in `state.js` to use the correct schema (see architecture.md)
- Add `uuid` and `joinedAt` fields to player objects

### 1.4 Wire up y-webrtc
- In `pages/room/[code].js`: replace local Y.Doc with `WebrtcProvider`
- Room ID: `poordown-${code}`
- Use Google + Cloudflare STUN servers
- Use `wss://signaling.yjs.dev` as signaling server
- Awareness for live presence

### 1.5 Host management
- `meta.set('hostId', uuid)` when host creates room
- On awareness change: detect host disconnect → elect next player in join order
- Rejoin: UUID match → restore player slot, do not reclaim host

**Milestone:** Two browser tabs on the same machine can play against each other in real time.

---

## Phase 2 — Complete Game Rules

With multiplayer working, fill in missing game mechanics.

### 2.1 Fix board rendering
- Fix corner positions in `Board.js` (see implementation-status.md bug #2)
- Audit and fix space position calculations for all four sides

### 2.2 All space landing effects
- Tax spaces: deduct cash automatically
- Go To Jail (space 30): call `sendToJail`, move token to space 10
- Jail turn handling: show options (pay $50 / roll doubles / use GOOJF card)
- Chance + Community Chest: draw from shuffled deck, apply effect
- Free Parking: optional jackpot (if config enabled)

### 2.3 Card decks
- Implement full 16-card Chance deck (see game-mechanics.md)
- Implement full 16-card Community Chest deck
- Shuffle on game start, reshuffle when exhausted
- Store shuffled deck in Y.js so all players see same cards

### 2.4 Auction
- When player declines to buy: start auction
- All players can bid (including current player)
- Highest bid after all players pass wins
- If no bids: property stays with bank

### 2.5 Bankruptcy flow
- When player can't pay: force them to sell houses/mortgage properties
- If still can't pay after liquidating everything: mark eliminated
- Transfer assets to creditor (bank or player)

### 2.6 Trading
- Any player can propose a trade on their turn
- Trade includes: cash, properties, GOOJF cards from each side
- Both parties confirm before executing
- TradeModal UI

**Milestone:** Full standard Monopoly game playable start to finish.

---

## Phase 3 — Polish

### 3.1 Animated token movement
- Instead of instant position update, animate token along board path
- Spring physics, 300ms per space
- Pause at each space briefly

### 3.2 Mobile layout
- Stacked layout on mobile (board top, actions bottom)
- Player sidebar as bottom sheet / drawer

### 3.3 Pre-game config
- Host sees config modal before starting
- Starting cash, free parking jackpot, auction toggle
- Config saved to `ydoc.getMap('config')`

### 3.4 Property management panel
- Click a property you own → manage: build house, sell house, mortgage
- View all owned properties in sidebar

### 3.5 UX polish
- Reconnect banner when a peer disconnects/reconnects
- Host migration notification ("X is now the host")
- Confetti on property purchase
- Toast notifications for game events (rent paid, card drawn, etc.)

---

## Open Decisions

| Question | Current thinking |
|----------|-----------------|
| What happens if host leaves mid-game? | Next player in join order auto-promoted (implemented in Phase 1.5) |
| Can you rejoin as host? | No — promoted host keeps the role |
| Auction timer? | No timer for now — players pass manually |
| Free parking jackpot? | Off by default, configurable |
| Cash-only trades allowed? | TBD — probably yes, it's friends playing |
| What if all players disconnect? | Game is lost — no server-side persistence |
| Undo support? | No — too complex for multiplayer |
| Bot players? | Out of scope for now |
