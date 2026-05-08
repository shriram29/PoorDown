# Research: boardgame.io

## What is boardgame.io?
- Official site: https://boardgame.io/
- NPM: v0.50.2, MIT license
- A framework for building turn-based games in JavaScript/TypeScript

## Core Concepts

### State Model
- **`G`** — Game state managed by developer (must be JSON-serializable, no classes/functions)
- **`ctx`** — Read-only metadata managed by the framework (turn, currentPlayer, numPlayers, phases, stages)

### Moves
Functions that describe how game state changes. Must be pure (no side effects) and only modify `G`.

### Events
Framework-provided functions that work on `ctx` (e.g., `endTurn()`, `endPhase()`).

### Phases
Periods that override game configuration with different rules/turn orders. Turns occur inside phases.

### Stages
Like phases but within a turn, applying to individual players (different players can be in different stages simultaneously).

### Turn Orders
Configurable turn sequences (single player, sequential, concurrent, etc.).

## Multiplayer Architecture

### Client-Server Model
- Uses Socket.IO for real-time communication
- Server runs the authoritative game state; clients receive state updates
- `Server` class manages game rooms and state synchronization
- "Master" client pattern: one client acts as master, all moves validated server-side

### Transport
HTTP/2 multiplexed over single connection (per issue #1192)

## Database Requirements

### Storage Abstraction Layer
- `boardgame.io/server` exports `Server` class
- Built-in support for **MongoDB** (via `boardgame.io/mongo`) and **Firebase**
- Default is **in-memory storage** (volatile — games lost on server restart)

### Database Interface Methods
`setState`, `setMetadata`, `fetch`, `wipe`, `createMatch`, `listMatches`

## React Integration
- View-layer agnostic — can use vanilla JS client or React bindings
- Moves dispatched via `props.moves.moveName()`
- Events dispatched via `props.events.endTurn()`
- Standard React project structure supported

## Hosting/Deployment
- Static frontend + Node.js server required for multiplayer
- Deployable to: Heroku, Firebase Hosting, GitHub Pages, Docker, Vercel (with custom server)
- **Important:** For multiplayer, a server must be deployed — client alone cannot host games

## Key Limitations

1. **State must be JSON-serializable** — No classes, functions, or non-JSON types in `G`
2. **In-memory default** — Without explicit database, game state lost on server restart
3. **Not production-ready for large scale** — Better for prototyping/mid-size games
4. **No native mobile clients** — Usable with React Native but no dedicated SDK
5. **No built-in authentication** — Must be added separately
6. **Version 0.50.2** (published ~3 years ago) — Questions about active maintenance
7. **Node.js version sensitivity** — Issues with Node v22/v23 for multiplayer tutorial
8. **Vercel serverless doesn't support WebSockets** — Major blocker for real-time on Vercel

## Resources
- Official Docs: https://boardgame.io/documentation/
- GitHub: https://github.com/boardgameio/boardgame.io