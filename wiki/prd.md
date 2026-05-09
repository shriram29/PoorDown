# PoorDown — Product Requirements

## Vision

PoorDown is an open-source, browser-based multiplayer Monopoly clone inspired by Richup.io. It runs entirely P2P — no database, no paid backend. Players create a room, share a link, and everyone connects directly. The experience should feel instant: click a link, type your name, you're in the game.

**Tagline:** *"The board game you know, anywhere you are."*

**Target user:** A group of 2–8 friends who want to play Monopoly online without signing up for anything or paying for anything.

---

## Core Principles

1. **Zero friction** — No accounts. No install. Share a link and play.
2. **Zero cost to host** — Vercel free tier + free STUN/signaling servers. No monthly bill.
3. **Faithful Monopoly** — All standard rules implemented. No weird omissions.
4. **Friends-first** — Designed for trusted groups, not competitive strangers. Honor system is fine.

---

## Features

### Must Have (MVP)
- Name + UUID identity stored in localStorage (no signup)
- Create room → get 6-char shareable code / link
- Join room via code or direct link
- Full Monopoly board (all 40 spaces)
- Real-time P2P sync via y-webrtc
- Turn flow: roll dice → move token → buy/auction/pay rent
- All space types: property, railroad, utility, chance, community chest, tax, jail, go to jail, free parking, go
- Property ownership, rent, color set bonus
- House/hotel building and selling
- Mortgage/unmortgage
- Jail mechanics (pay $50, roll doubles, max 3 turns)
- Bankruptcy and elimination
- Win condition (last player standing)
- Host manages game start and settings
- Host migration on disconnect

### Should Have
- Trading between players
- Auction when player declines to buy
- Chance and Community Chest card decks (full 16 cards each)
- Pre-game rule configuration (starting cash, free parking jackpot, etc.)
- Reconnect/rejoin (UUID matching restores player state)

### Nice to Have
- Mobile responsive layout
- Token selection (pick from 8 token styles)
- Animated token movement along board path
- Property management panel (build, mortgage from sidebar)
- "How to Play" overlay
- Sound effects

### Out of Scope
- Bot/AI players (cut for now — focus on multiplayer)
- Spectator mode
- Persistent game history
- Chat

---

## Design Language

### Aesthetic
Mid-century modern meets flat design. Classic board game feel with clean SVG visuals and smooth animations. Reference: vintage Parker Brothers artwork + modern flat UI polish (Linear/Figma level).

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Board Green | `#2D6A4F` | Board background, safe spaces, success actions |
| Cream | `#F8F4E8` | Card backgrounds, page background, UI surfaces |
| Player Red | `#E63946` | Primary action buttons, player 1 token |
| Player Blue | `#1D3557` | Secondary actions, player 2 token, borders |
| Gold | `#F4A261` | Money displays, End Turn button, highlights |
| Dark | `#2B2D42` | Text, headers, room code display |
| Jail Orange | `#E76F51` | Jail corner, Go To Jail corner |
| Rail Gray | `#8D99AE` | Railroad properties, disabled states, muted text |

### Property Group Colors

| Group | Hex | Properties |
|-------|-----|------------|
| Brown | `#8B4513` | Mediterranean Ave, Baltic Ave |
| Light Blue | `#87CEEB` | Oriental Ave, Vermont Ave, Connecticut Ave |
| Pink | `#FF69B4` | St. Charles Place, States Ave, Virginia Ave |
| Orange | `#FF8C00` | St. James Place, Tennessee Ave, New York Ave |
| Red | `#E63946` | Kentucky Ave, Indiana Ave, Illinois Ave |
| Yellow | `#FFD700` | Atlantic Ave, Ventnor Ave, Marvin Gardens |
| Green | `#228B22` | Pacific Ave, North Carolina Ave, Pennsylvania Ave |
| Dark Blue | `#1D3557` | Park Place, Boardwalk |

### Typography

| Role | Font | Usage |
|------|------|-------|
| Headings | `Playfair Display` | Game title, modal headers, corner labels |
| Body / UI | `Inter` | All body text, labels, buttons, player names |
| Numbers / Codes | `JetBrains Mono` | Cash amounts, room codes, dice values |

### Spacing
- Base unit: `8px`
- Component padding: `16px` / `24px`
- Card border radius: `12px`
- Large modals: `24px`

### Motion
- Dice roll: CSS 3D transform, bounce easing, 400ms
- Token movement: spring interpolation along board path, 300ms per space
- Card reveal: slide-up with fade, 200ms ease-out
- Turn indicator: subtle scale pulse on active player
- All animations respect `prefers-reduced-motion`

---

## Layout

### Landing Page (`/`)
- Hero: "PoorDown" title + tagline
- Two cards side by side: Create Room / Join Room
- Create Room: name input → generates room code → navigates to `/room/[code]`
- Join Room: name input + code input → navigates to `/room/[code]`
- Name pre-filled from localStorage if returning user
- "How to Play" section below

### Game Room (`/room/[code]`)

```
┌──────────────────────────────────────────────────────────────┐
│  PoorDown    [ROOM CODE] 📋     [Player badges row]         │
├─────────────────────────────────┬────────────────────────────┤
│                                 │                            │
│         MONOPOLY BOARD          │    Players sidebar         │
│         (SVG, square)           │    (HUD cards per player)  │
│                                 │                            │
├─────────────────────────────────│    Phase: rolling          │
│  [Dice]   [Action Bar]          │    Room: ABCDEF            │
└─────────────────────────────────┴────────────────────────────┘
```

Desktop: board left, player sidebar right (300px)
Mobile: board top, action bar bottom, sidebar hidden/drawer

---

## User Identity Flow

1. First visit to any page: prompt "What do we call you?" (modal, can't dismiss without entering name)
2. Generate UUID with `nanoid()`, store `{ uuid, name }` in localStorage as `poordown_identity`
3. All subsequent visits: skip prompt, use stored name
4. Name shown in header with small edit button
5. On room join: UUID matched against existing player list for rejoin detection

---

## Room & Multiplayer Flow

1. Host creates room → 6-char code generated → navigated to `/room/[code]?host=true`
2. Host shares URL (copy button)
3. Others open URL → land on join screen → confirm name → enter room
4. Host sees "Start Game" button when 2+ players present
5. Host configures optional rules → clicks Start → game begins
6. All players see live board state via Y.js CRDT sync over WebRTC
