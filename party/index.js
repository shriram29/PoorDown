// PartyKit server for RichDown
// Handles real-time multiplayer state sync via Y.js
//
// Each room = one Y.js document
// Players connect via WebSocket
// State is synced via CRDT (Y.js)

export default {
  // Called when a client connects
  async onConnect(conn, room) {
    console.log(`[${room}] Client connected: ${conn.id}`);
    
    // Get or create the Y.js document for this room
    const doc = room.storage.doc || new (await import('yjs')).Doc();
    room.storage.doc = doc;
    
    // Set up the PartyKit provider for Y.js
    // The provider will handle syncing the document state
    // to all connected clients automatically
    
    // Notify other clients that a new player joined
    conn.send(JSON.stringify({
      type: 'playerJoined',
      playerId: conn.id,
    }));
  },

  // Called when a message is received from a client
  async onMessage(message, conn, room) {
    const doc = room.storage.doc;
    if (!doc) return;

    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'sync':
          // Client is sending a Y.js update - apply it
          Y.applyUpdate(doc, new Uint8Array(data.update));
          break;
          
        case 'playerInfo':
          // Player info (name, color) being shared
          // This would update awareness state
          break;
          
        default:
          console.log(`[${room}] Unknown message type: ${data.type}`);
      }
    } catch (err) {
      console.error(`[${room}] Error parsing message:`, err);
    }
  },

  // Called when a client disconnects
  async onClose(conn, room) {
    console.log(`[${room}] Client disconnected: ${conn.id}`);
    
    // Clean up will happen automatically when room is empty
    // Room state persists in PartyKit until:
    // 1. All players leave + 30min inactivity
    // 2. Room is explicitly destroyed
  },
};

// Import Y.js for updates
import * as Y from 'yjs';