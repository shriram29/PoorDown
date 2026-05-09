# PoorDown — Wiki

This folder is the single source of truth for everything about PoorDown. All product, design, architecture, and implementation decisions live here.

## Index

| Document | What's in it |
|----------|-------------|
| [prd.md](./prd.md) | Vision, design language, color palette, typography, layout |
| [architecture.md](./architecture.md) | Tech stack, Y.js schema, WebRTC P2P design, host management, identity |
| [game-mechanics.md](./game-mechanics.md) | Full Monopoly rules, board data, space types, card decks |
| [implementation-status.md](./implementation-status.md) | What's built, what's broken, what's missing |
| [roadmap.md](./roadmap.md) | Phases, priorities, open decisions |
| [design.md](./design.md) | Brand identity, SVG assets (logo, dice, tokens), color system, typography, component specs, animation |

## Quick Summary

PoorDown is a browser-based multiplayer Monopoly clone inspired by Richup.io. It's serverless — game state syncs P2P between players via Y.js + WebRTC (`y-webrtc`). No database, no paid infra. Deploy to Vercel for free.

- **Stack:** Next.js 14 · Y.js · y-webrtc · Framer Motion · Tailwind
- **Multiplayer:** WebRTC mesh via `y-webrtc`, free STUN servers, free public signaling
- **Identity:** Name + UUID stored in localStorage on first visit
- **Rooms:** 6-char code, up to 8 players, host manages game flow
- **Hosting:** Vercel (frontend only, no server needed)
