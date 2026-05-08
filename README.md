# RichDown 🏠

> The board game you know, anywhere you are.

An open-source multiplayer Monopoly clone built with Next.js, PartyKit, and Y.js. Play with friends via room codes — no accounts required, no database needed.

**Note:** This is a work-in-progress. Phase 1 (MVP) is complete but multiplayer sync via PartyKit is not yet connected.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (JavaScript, Pages Router) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Real-time | PartyKit + Y.js (WebSocket + CRDT) |
| Icons | Lucide React |
| Fonts | Playfair Display, Inter, JetBrains Mono |

## Features

- 🎲 Real-time multiplayer Monopoly gameplay
- 🔗 Database-less rooms — share a 6-char code
- 🤖 Bot players (Easy difficulty)
- 🏠 Buy properties, build houses/hotels
- 🔄 Trading between players
- 💰 Full rent system with color sets
- 🏆 Win condition detection

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/richdown.git
cd richdown

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### PartyKit Setup (for multiplayer)

```bash
# Install PartyKit CLI
npm install -g partykit

# Deploy PartyKit server
npx partykit deploy

# Set your PartyKit host in .env.local
echo "NEXT_PUBLIC_PARTYKIT_HOST=your-name.partykit.dev" > .env.local
```

## Project Structure

```
richdown/
├── pages/
│   ├── index.js          # Lobby: Create/Join room
│   └── room/[code].js    # Game room
├── components/
│   ├── board/            # SVG Monopoly board
│   ├── dice/            # 3D CSS dice
│   ├── hud/             # Player HUD, ActionBar
│   ├── modals/          # Property purchase modal
│   ├── lobby/            # CreateRoom, JoinRoom
│   └── ui/              # Generic Modal component
├── lib/
│   ├── game/
│   │   ├── board.js      # 40-space board data
│   │   └── state.js     # Y.js game state + moves
│   └── partykit/        # (future) PartyKit client
├── party/
│   └── index.js          # PartyKit server
├── styles/
│   └── globals.css       # Tailwind + custom CSS
├── SPEC.md               # Technical specification
└── prd.md               # Product requirements
```

## TODO

### Phase 1 ✅ (MVP - Complete)
- [x] Next.js project setup + Tailwind
- [x] Board data (40 spaces)
- [x] SVG board rendering
- [x] Dice component
- [x] Player tokens
- [x] Basic game state (Y.js)
- [x] Lobby (create/join room)
- [x] Turn flow (roll → move → buy)
- [x] Bot players (Easy)

### Phase 2 — Full Game
- [ ] All 40 space mechanics (chance, community, tax, jail)
- [ ] Rent system with color sets
- [ ] House/hotel building + selling
- [ ] Trading UI
- [ ] Bankruptcy handling
- [ ] Win condition
- [ ] All bot difficulties (Easy/Medium/Hard)

### Phase 3 — Polish
- [ ] Rule configuration UI (host settings)
- [ ] How to Play tutorial
- [ ] Mobile responsive
- [ ] Animations refinement
- [ ] Production PartyKit deployment

## License

MIT © Shriram

## Contributing

Pull requests welcome! Please read SPEC.md before making major changes.