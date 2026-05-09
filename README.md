# PoorDown

> The board game you know, anywhere you are.

PoorDown is an open-source multiplayer Monopoly clone you can play in the browser with friends — no account, no install, no cost. Share a link. Everyone joins. Play.

Built with Next.js and Y.js. Game state syncs peer-to-peer over WebRTC. Deploys to Vercel for free. No server, no database.

---

## How it works

1. Open the app and enter your name (saved for next time)
2. Click **Create Room** — you get a 6-character room code
3. Share the link with friends
4. Friends open the link, enter their names, and join
5. Host clicks **Start Game** when everyone's ready (2–8 players)
6. Play standard Monopoly — buy properties, collect rent, build houses, bankrupt your friends

Game state is synced directly between players' browsers over WebRTC. No server holds your game data. If the host disconnects, the next player in line automatically becomes host.

---

## Tech stack

| | |
|--|--|
| Framework | Next.js 14 (Pages Router) |
| Real-time sync | Y.js + y-webrtc (WebRTC P2P) |
| Animations | Framer Motion |
| Styling | Tailwind CSS |
| Hosting | Vercel |

No backend. No database. No paid services. Free STUN servers for WebRTC, free public signaling server for initial peer handshake.

---

## Running locally

```bash
git clone https://github.com/YOUR_USERNAME/poordown
cd poordown
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables needed.

---

## Deploying

```bash
npm install -g vercel
vercel
```

That's it. No other services to deploy or configure.

---

## Project status

Active development. Core board and game logic are implemented. Real-time multiplayer is the current focus.

See [`wiki/implementation-status.md`](./wiki/implementation-status.md) for a detailed breakdown of what works, what's broken, and what's next.

---

## Documentation

Everything lives in [`wiki/`](./wiki/):

| | |
|--|--|
| [`wiki/prd.md`](./wiki/prd.md) | Product vision, design language, features |
| [`wiki/architecture.md`](./wiki/architecture.md) | Tech decisions, Y.js schema, P2P design, host system |
| [`wiki/game-mechanics.md`](./wiki/game-mechanics.md) | Full Monopoly rules reference |
| [`wiki/design.md`](./wiki/design.md) | Brand, colors, typography, SVG assets, component specs |
| [`wiki/implementation-status.md`](./wiki/implementation-status.md) | Current state, known bugs |
| [`wiki/roadmap.md`](./wiki/roadmap.md) | What's being built next |

---

## Contributing

Read [`CLAUDE.md`](./CLAUDE.md) before making changes — it covers the key architectural decisions and what not to break.

Pull requests welcome.

---

## License

MIT
