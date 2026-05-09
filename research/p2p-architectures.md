# Research: P2P / Database-less Multiplayer Game Architectures

## Critical Issue: Vercel + WebSockets
⚠️ **Vercel serverless functions DO NOT support WebSockets** — this is a major blocker for real-time multiplayer on Vercel alone.

Workarounds:
- Use **PartyKit** (deploys separately to Cloudflare)
- Use third-party services (**PubNub**, **Liveblocks**, **Supabase**)
- Deploy game server separately (**Colyseus**, **Lance.gg**)
- Use **PartyKit** which has native Next.js integration

---

## Key Technologies

### 1. WebRTC (via PeerJS)
- **Pros:** True P2P, no server required after connection, low latency, encrypted
- **Cons:** Requires signaling server for initial connection, NAT traversal issues
- **Best for:** Small player counts (2-4), direct peer communication
- **Note:** PeerJS wraps WebRTC nicely but signaling still needed

### 2. Y.js (CRDT-based)
- **Pros:** Conflict-free merges, works offline, rich ecosystem
- **Cons:** y-webrtc provider has known issues (creator paused development)
- **Providers:** y-websocket (requires server) or y-webrtc (P2P but problematic)
- **Verdict:** Works for game state but may need custom conflict resolution

### 3. PartyKit ⭐ *Best Vercel Integration*
- **Pros:** Native Next.js integration, game starter template available, deploys to Cloudflare edge
- **Cons:** Database-less (no persistent storage), may need external service for matchmaking
- **Starter:** Next.js + Redux game starter template exists
- **Works with:** Y.js, Automerge, Replicache, XState
- **URL:** https://partykit.io/

### 4. Liveblocks
- **Pros:** Fully managed, built-in Yjs support, presence & broadcast features
- **Cons:** Pricing (free tier limited), vendor lock-in
- **Good for:** Real-time collaboration features in games

### 5. Supabase Realtime
- **Pros:** Free tier available, broadcast/presence features, PostgreSQL for persistence
- **Cons:** Not truly P2P, uses WebSocket connections

### 6. Colyseus
- **Pros:** Authoritative server, proven multiplayer framework
- **Cons:** Not serverless, requires separate hosting

### 7. Lance.gg
- **Pros:** Authoritative server designed for real-time games
- **Cons:** Requires separate deployment

---

## Recommended Architecture for RichDown

Given **Next.js + Vercel** requirement with database-less room concept:

### Primary: PartyKit + Y.js
1. **PartyKit** for real-time WebSocket connections (separate deployment to Cloudflare)
2. **Y.js** for CRDT-based game state (handles conflicts gracefully)
3. **Game logic** validates moves before state updates
4. **Room codes** for matchmaking (simple, no external service needed)

### Alternative: PeerJS (True P2P)
- If we want completely serverless after connection
- Use a minimal signaling server (can be hosted on free tier)
- Works for small player counts

---

## Architecture Comparison

| Approach | Vercel Compatible | P2P | DB-less | Complexity |
|----------|-------------------|-----|---------|------------|
| PartyKit + Y.js | ✅ (via separate deploy) | Partial | ✅ | Medium |
| PeerJS | ✅ | ✅ | ✅ | Medium |
| Liveblocks | ✅ | ❌ | ❌ | Low |
| Colyseus | ❌ | ❌ | ❌ | High |

---

## Key Decision Factors

1. **Real-time sync** — All players must see the same game state instantly
2. **Conflict resolution** — Multiple players can act simultaneously (Monopoly has this)
3. **Room management** — Database-less = room codes, no persistence across sessions
4. **Host migration** — What happens when the host disconnects?
5. **Vercel compatibility** — Must work with Next.js frontend on Vercel

---

## Resources
- https://partykit.io/
- https://yjs.dev/
- https://peerjs.com/
- https://liveblocks.io/
- https://colyseus.io/