import { WebSocketServer } from 'ws';
import http from 'http';

const port = process.env.PORT || 4444;
const pingInterval = 30000;

const topics = new Map();

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (conn) => {
  const subscribed = new Set();
  let alive = true;

  const ping = setInterval(() => {
    if (!alive) { conn.close(); clearInterval(ping); return; }
    alive = false;
    conn.ping();
  }, pingInterval);

  conn.on('pong', () => { alive = true; });

  conn.on('close', () => {
    clearInterval(ping);
    subscribed.forEach(topic => {
      const subs = topics.get(topic);
      if (subs) { subs.delete(conn); if (subs.size === 0) topics.delete(topic); }
    });
  });

  conn.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || !msg.type) return;

    if (msg.type === 'subscribe') {
      (msg.topics || []).forEach(t => {
        if (typeof t !== 'string') return;
        if (!topics.has(t)) topics.set(t, new Set());
        topics.get(t).add(conn);
        subscribed.add(t);
      });
    } else if (msg.type === 'unsubscribe') {
      (msg.topics || []).forEach(t => {
        const subs = topics.get(t);
        if (subs) subs.delete(conn);
        subscribed.delete(t);
      });
    } else if (msg.type === 'publish' && msg.topic) {
      const subs = topics.get(msg.topic);
      if (subs) {
        const out = JSON.stringify({ ...msg, clients: subs.size });
        subs.forEach(c => { if (c.readyState === 1) c.send(out); });
      }
    } else if (msg.type === 'ping') {
      conn.send(JSON.stringify({ type: 'pong' }));
    }
  });
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

server.listen(port, () => {
  console.log(`Signaling server listening on port ${port}`);
});
