import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { startHand, endHand, canPlayCard, drawFromDeck } from '../../../lib/games/uno/state';
import { handPoints } from '../../../lib/games/uno/deck';

const GAME_COLOR = '#E53935';
const GAME_GLOW = 'rgba(229,57,53,0.4)';

const BG = '#0a0f1e';
const SURFACE = '#0f1729';
const PANEL = '#162037';
const PANEL_DARK = '#080c17';
const PANEL_BORDER = 'rgba(100,130,220,0.25)';
const TEXT = '#e8e4f0';
const TEXT_DIM = '#6070aa';
const GOLD = '#c8983a';

const PLAYER_COLORS = [
  '#FF3B30', '#0A84FF', '#30D158', '#FFD60A',
  '#BF5AF2', '#32D2D0', '#FF9F0A', '#FF375F',
];

const CARD_BG = {
  red: '#C62828',
  yellow: '#F9A825',
  green: '#2E7D32',
  blue: '#1565C0',
};

const COLOR_LABEL = { red: 'Red', yellow: 'Yellow', green: 'Green', blue: 'Blue' };

function mod(n, m) { return ((n % m) + m) % m; }

// ── Card symbol helper ────────────────────────────────────────────────────────

function cardSymbol(card) {
  if (card.type === 'number') return String(card.value);
  if (card.type === 'skip') return '⊘';
  if (card.type === 'reverse') return '↺';
  if (card.type === 'draw-two') return '+2';
  if (card.type === 'wild') return 'W';
  if (card.type === 'wild-draw-four') return '+4';
  return '?';
}

// ── UnoCard component ─────────────────────────────────────────────────────────

function UnoCard({ card, playable, onClick, large, small, dimmed }) {
  const [hov, setHov] = useState(false);
  const w = large ? 80 : small ? 38 : 56;
  const h = large ? 120 : small ? 56 : 84;
  const r = large ? 12 : 8;
  const isWild = card.type === 'wild' || card.type === 'wild-draw-four';
  const bg = isWild ? '#1a1a2e' : (CARD_BG[card.color] || '#333');
  const sym = cardSymbol(card);
  const symSize = card.type === 'number'
    ? (large ? 40 : small ? 16 : 26)
    : (large ? 24 : small ? 12 : 16);

  return (
    <div
      onClick={playable ? onClick : undefined}
      onMouseEnter={() => playable && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: w, height: h, borderRadius: r,
        backgroundColor: bg,
        border: `2px solid ${hov && playable ? '#fff' : 'rgba(255,255,255,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: playable ? 'pointer' : 'default',
        opacity: dimmed ? 0.38 : 1,
        transform: hov && playable ? 'translateY(-16px) scale(1.06)' : 'none',
        boxShadow: hov && playable
          ? `0 14px 32px rgba(0,0,0,0.75), 0 0 22px ${bg}99`
          : '0 3px 10px rgba(0,0,0,0.55)',
        transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
        flexShrink: 0, position: 'relative', overflow: 'hidden',
        animation: large ? 'cardAppear 0.3s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
      }}
    >
      {/* Wild quadrants */}
      {isWild && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', backgroundColor: CARD_BG.red }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '50%', backgroundColor: CARD_BG.yellow }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: '50%', backgroundColor: CARD_BG.green }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', backgroundColor: CARD_BG.blue }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#1a1a2e', borderRadius: '50%', width: '62%', height: '62%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: large ? 13 : small ? 7 : 10, color: 'white', textAlign: 'center', lineHeight: 1 }}>
                {card.type === 'wild-draw-four' ? '+4' : 'W'}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Regular card */}
      {!isWild && (
        <>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '70%', height: '85%', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.13)', transform: 'rotate(-30deg)' }} />
          </div>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: symSize, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.5)', position: 'relative', zIndex: 1 }}>
            {sym}
          </span>
        </>
      )}
    </div>
  );
}

// ── Card back ─────────────────────────────────────────────────────────────────

function CardBack({ large, small }) {
  const w = large ? 80 : small ? 38 : 56;
  const h = large ? 120 : small ? 56 : 84;
  return (
    <div style={{
      width: w, height: h, borderRadius: large ? 12 : 8,
      backgroundColor: '#12183a',
      border: `2px solid ${GAME_COLOR}44`,
      backgroundImage: `repeating-linear-gradient(45deg, ${GAME_COLOR}09 0px, ${GAME_COLOR}09 2px, transparent 2px, transparent 10px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 3px 10px rgba(0,0,0,0.55)', flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: large ? 13 : small ? 7 : 10, color: `${GAME_COLOR}88`, letterSpacing: '1px' }}>UNO</span>
    </div>
  );
}

// ── Other player mini panel ────────────────────────────────────────────────────

function OtherPlayer({ player, isActive, color }) {
  const count = player.hand.length;
  return (
    <div style={{
      backgroundColor: isActive ? PANEL : SURFACE,
      border: `2px solid ${isActive ? color : PANEL_BORDER}`,
      borderTop: `4px solid ${color}`,
      borderRadius: 12, padding: '10px 14px', minWidth: 120, flexShrink: 0,
      boxShadow: isActive ? `0 0 20px ${color}55` : '0 4px 12px rgba(0,0,0,0.4)',
      transition: 'border-color 0.25s, box-shadow 0.25s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700', fontSize: 13, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{player.name}</span>
        {isActive && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0, animation: 'blink 1s infinite' }} />}
        {count === 1 && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: '800', color: GAME_COLOR, backgroundColor: `${GAME_COLOR}22`, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>UNO!</span>}
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
        {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
          <CardBack key={i} small />
        ))}
        {count > 6 && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: TEXT_DIM, marginLeft: 2, alignSelf: 'center' }}>+{count - 6}</span>}
        {count === 0 && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: TEXT_DIM }}>No cards</span>}
      </div>
    </div>
  );
}

// ── Color chooser ─────────────────────────────────────────────────────────────

function ColorChooser({ onChoose }) {
  const colors = ['red', 'yellow', 'green', 'blue'];
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ backgroundColor: PANEL, border: `1px solid ${PANEL_BORDER}`, borderRadius: 20, padding: '28px 32px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 18, color: TEXT, margin: '0 0 20px 0' }}>Choose a color</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {colors.map(c => (
            <button
              key={c}
              onClick={() => onChoose(c)}
              style={{
                width: 80, height: 80, borderRadius: 14,
                backgroundColor: CARD_BG[c],
                border: '3px solid rgba(255,255,255,0.25)',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: '700', color: 'white',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'transform 0.12s, box-shadow 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            >
              {COLOR_LABEL[c]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Rules panel ───────────────────────────────────────────────────────────────

const RULES = [
  { title: 'Goal', body: 'Be the first to empty your hand each round. The winner collects points from all other players\' remaining cards. First to 500 cumulative points wins the game.' },
  { title: 'Setup', body: 'Each player is dealt 7 cards. The top card of the draw pile is flipped to start the discard pile.' },
  { title: 'On your turn', body: 'Play one card from your hand that matches the top discard card by color or value. If you can\'t (or don\'t want to) play, draw one card — then your turn ends.' },
  { title: 'Matching', body: 'A card can be played if it matches the current color OR the type/value of the top discard card. Wild cards can always be played.' },
  { title: 'Skip ⊘', body: 'The next player in sequence loses their turn.' },
  { title: 'Reverse ↺', body: 'Reverses the direction of play. In a 2-player game it acts like a Skip.' },
  { title: 'Draw Two +2', body: 'The next player must draw 2 cards and loses their turn.' },
  { title: 'Wild W', body: 'Play on any card. You choose the new active color.' },
  { title: 'Wild Draw Four +4', body: 'Play on any card. You choose the new color AND the next player draws 4 and loses their turn.' },
  { title: 'UNO!', body: 'When you are down to 1 card, "UNO!" is automatically announced.' },
  { title: 'Scoring', body: 'Number cards = face value · Skip / Reverse / Draw Two = 20 pts · Wild / Wild Draw Four = 50 pts. Points come from other players\' leftover hands.' },
];

function RulesPanel({ open, onClose }) {
  return (
    <div style={{ position: 'fixed', bottom: 68, right: 20, zIndex: 300, width: 340, maxHeight: open ? '70vh' : 0, overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}>
      <div style={{ backgroundColor: PANEL, border: `1px solid ${GAME_COLOR}55`, borderRadius: '16px 16px 4px 16px', boxShadow: '0 -8px 40px rgba(0,0,0,0.7)', maxHeight: '70vh', overflowY: 'auto', scrollbarWidth: 'thin' }}>
        <div style={{ position: 'sticky', top: 0, backgroundColor: PANEL, padding: '16px 18px 12px', borderBottom: `1px solid ${PANEL_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 16, color: TEXT }}>📖 How to Play</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px' }} onMouseEnter={e => (e.currentTarget.style.color = TEXT)} onMouseLeave={e => (e.currentTarget.style.color = TEXT_DIM)}>×</button>
        </div>
        <div style={{ padding: '14px 18px 20px' }}>
          {RULES.map((r, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700', fontSize: 12, color: GAME_COLOR, margin: '0 0 3px 0' }}>{r.title}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: TEXT_DIM, margin: 0, lineHeight: 1.65 }}>{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UnoRoom() {
  const router = useRouter();
  const { code } = router.query;

  const [myUuid, setMyUuid] = useState(null);
  const [peers, setPeers] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [gameState, setGameState] = useState({
    phase: 'connecting', players: [], deck: [], discardPile: [],
    currentPlayerIdx: 0, direction: 1, currentColor: null,
    pendingAction: null, cumulativeScores: {}, winner: null,
    winnerUuid: null, roundNum: 0, hostId: null,
  });

  const metaRef = useRef(null);
  const yLobbyRef = useRef(null);
  const hasJoinedRef = useRef(false);

  // ── Y.js setup ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!code || typeof window === 'undefined') return;

    const stored = localStorage.getItem('poordown_identity');
    const identity = stored ? JSON.parse(stored) : null;
    if (!identity) { router.push('/'); return; }
    setMyUuid(identity.uuid);

    const isHost = new URLSearchParams(window.location.search).get('host') === 'true';
    const doc = new Y.Doc();
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || 'ws://localhost:4444';
    const provider = new WebrtcProvider(`poordown-uno-${code}`, doc, {
      signaling: [signalingUrl],
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
      maxConns: 10,
    });

    provider.awareness.setLocalStateField('player', { uuid: identity.uuid });
    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      setPeers(states.filter(s => s.player?.uuid && s.player.uuid !== identity.uuid).length);
    });

    const meta = doc.getMap('meta');
    const yLobby = doc.getArray('lobbyPlayers');
    metaRef.current = meta;
    yLobbyRef.current = yLobby;

    if (isHost && !meta.get('hostId')) {
      meta.set('hostId', identity.uuid);
      meta.set('phase', 'lobby');
      meta.set('cumulativeScores', '{}');
      meta.set('roundNum', 0);
    }

    if (!hasJoinedRef.current) {
      hasJoinedRef.current = true;
      const existing = yLobby.toArray();
      if (!existing.find(p => p.uuid === identity.uuid)) {
        yLobby.push([{ uuid: identity.uuid, name: identity.name }]);
      }
    }

    const syncMeta = () => {
      setGameState({
        phase: meta.get('phase') || (isHost ? 'lobby' : 'connecting'),
        players: JSON.parse(meta.get('players') || '[]'),
        deck: JSON.parse(meta.get('deck') || '[]'),
        discardPile: JSON.parse(meta.get('discardPile') || '[]'),
        currentPlayerIdx: meta.get('currentPlayerIdx') ?? 0,
        direction: meta.get('direction') ?? 1,
        currentColor: meta.get('currentColor') || null,
        pendingAction: meta.get('pendingAction') ? JSON.parse(meta.get('pendingAction')) : null,
        cumulativeScores: JSON.parse(meta.get('cumulativeScores') || '{}'),
        winner: meta.get('winner') || null,
        winnerUuid: meta.get('winnerUuid') || null,
        roundNum: meta.get('roundNum') ?? 0,
        hostId: meta.get('hostId') || null,
      });
    };

    const syncLobby = () => {
      const all = yLobby.toArray();
      const seen = new Set();
      setLobbyPlayers(all.filter(p => { if (seen.has(p.uuid)) return false; seen.add(p.uuid); return true; }));
    };

    meta.observe(syncMeta);
    yLobby.observe(syncLobby);
    syncMeta();
    syncLobby();

    return () => {
      meta.unobserve(syncMeta);
      yLobby.unobserve(syncLobby);
      provider.destroy();
      doc.destroy();
    };
  }, [code]);

  // ── Game logic ───────────────────────────────────────────────────────────────

  const handlePlayCard = useCallback((cardId) => {
    const meta = metaRef.current;
    if (!meta) return;

    let players = JSON.parse(meta.get('players') || '[]');
    let deck = JSON.parse(meta.get('deck') || '[]');
    let discardPile = JSON.parse(meta.get('discardPile') || '[]');
    const currentIdx = meta.get('currentPlayerIdx') ?? 0;
    const direction = meta.get('direction') ?? 1;
    const currentColor = meta.get('currentColor');
    const n = players.length;

    const player = { ...players[currentIdx], hand: [...players[currentIdx].hand] };
    const cardIdx = player.hand.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return;
    const card = player.hand[cardIdx];

    const topCard = discardPile[discardPile.length - 1];
    if (!canPlayCard(card, topCard, currentColor)) return;

    player.hand.splice(cardIdx, 1);
    discardPile.push(card);
    players[currentIdx] = player;

    if (player.hand.length === 0) {
      meta.set('players', JSON.stringify(players));
      meta.set('discardPile', JSON.stringify(discardPile));
      meta.set('deck', JSON.stringify(deck));
      endHand(meta, players, JSON.parse(meta.get('cumulativeScores') || '{}'));
      return;
    }

    const newColor = card.color || currentColor;
    const nextIdx = mod(currentIdx + direction, n);
    const skipIdx = mod(currentIdx + 2 * direction, n);

    if (card.type === 'skip') {
      meta.set('players', JSON.stringify(players));
      meta.set('discardPile', JSON.stringify(discardPile));
      meta.set('currentColor', newColor);
      meta.set('currentPlayerIdx', skipIdx);
      return;
    }

    if (card.type === 'reverse') {
      const newDir = -direction;
      meta.set('direction', newDir);
      meta.set('currentColor', newColor);
      meta.set('players', JSON.stringify(players));
      meta.set('discardPile', JSON.stringify(discardPile));
      if (n === 2) {
        // acts like skip: current player goes again — don't change idx
      } else {
        meta.set('currentPlayerIdx', mod(currentIdx + newDir, n));
      }
      return;
    }

    if (card.type === 'draw-two') {
      const { drawn, deck: d2, discardPile: dp2 } = drawFromDeck(deck, discardPile, 2);
      players[nextIdx] = { ...players[nextIdx], hand: [...players[nextIdx].hand, ...drawn] };
      meta.set('players', JSON.stringify(players));
      meta.set('discardPile', JSON.stringify(dp2));
      meta.set('deck', JSON.stringify(d2));
      meta.set('currentColor', newColor);
      meta.set('currentPlayerIdx', skipIdx);
      return;
    }

    if (card.type === 'wild' || card.type === 'wild-draw-four') {
      meta.set('players', JSON.stringify(players));
      meta.set('discardPile', JSON.stringify(discardPile));
      meta.set('pendingAction', JSON.stringify({
        type: 'choose-color',
        playerIdx: currentIdx,
        isDrawFour: card.type === 'wild-draw-four',
      }));
      return;
    }

    // Normal number card
    meta.set('players', JSON.stringify(players));
    meta.set('discardPile', JSON.stringify(discardPile));
    meta.set('currentColor', newColor);
    meta.set('currentPlayerIdx', nextIdx);
  }, []);

  const handleChooseColor = useCallback((color) => {
    const meta = metaRef.current;
    if (!meta) return;
    const pending = JSON.parse(meta.get('pendingAction') || 'null');
    if (!pending || pending.type !== 'choose-color') return;

    const { playerIdx, isDrawFour } = pending;
    const direction = meta.get('direction') ?? 1;
    const n = JSON.parse(meta.get('players') || '[]').length;

    meta.set('currentColor', color);
    meta.set('pendingAction', null);

    const nextIdx = mod(playerIdx + direction, n);
    const skipIdx = mod(playerIdx + 2 * direction, n);

    if (isDrawFour) {
      let players = JSON.parse(meta.get('players') || '[]');
      const { drawn, deck: d2, discardPile: dp2 } = drawFromDeck(
        JSON.parse(meta.get('deck') || '[]'),
        JSON.parse(meta.get('discardPile') || '[]'),
        4
      );
      players[nextIdx] = { ...players[nextIdx], hand: [...players[nextIdx].hand, ...drawn] };
      meta.set('players', JSON.stringify(players));
      meta.set('deck', JSON.stringify(d2));
      meta.set('discardPile', JSON.stringify(dp2));
      meta.set('currentPlayerIdx', skipIdx);
    } else {
      meta.set('currentPlayerIdx', nextIdx);
    }
  }, []);

  const handleDraw = useCallback(() => {
    const meta = metaRef.current;
    if (!meta) return;
    let players = JSON.parse(meta.get('players') || '[]');
    const currentIdx = meta.get('currentPlayerIdx') ?? 0;
    const direction = meta.get('direction') ?? 1;
    const n = players.length;

    const { drawn, deck: d2, discardPile: dp2 } = drawFromDeck(
      JSON.parse(meta.get('deck') || '[]'),
      JSON.parse(meta.get('discardPile') || '[]'),
      1
    );
    if (drawn.length > 0) {
      players[currentIdx] = { ...players[currentIdx], hand: [...players[currentIdx].hand, ...drawn] };
    }
    meta.set('players', JSON.stringify(players));
    meta.set('deck', JSON.stringify(d2));
    meta.set('discardPile', JSON.stringify(dp2));
    meta.set('currentPlayerIdx', mod(currentIdx + direction, n));
  }, []);

  const handleStartHand = useCallback(() => {
    const meta = metaRef.current;
    const yLobby = yLobbyRef.current;
    if (!meta || !yLobby) return;
    const all = yLobby.toArray();
    const seen = new Set();
    const unique = all.filter(p => { if (seen.has(p.uuid)) return false; seen.add(p.uuid); return true; });
    startHand(meta, unique);
  }, []);

  const handleNextHand = useCallback(() => {
    const meta = metaRef.current;
    const yLobby = yLobbyRef.current;
    if (!meta || !yLobby) return;
    const all = yLobby.toArray();
    const seen = new Set();
    startHand(meta, all.filter(p => { if (seen.has(p.uuid)) return false; seen.add(p.uuid); return true; }));
  }, []);

  const handlePlayAgain = useCallback(() => {
    const meta = metaRef.current;
    if (!meta) return;
    meta.set('cumulativeScores', '{}');
    meta.set('winner', null);
    meta.set('winnerUuid', null);
    meta.set('roundNum', 0);
    meta.set('nextHandStartIdx', 0);
    meta.set('phase', 'lobby');
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/uno/room/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const { phase, players, discardPile, currentPlayerIdx, direction, currentColor, pendingAction, cumulativeScores, winner, winnerUuid, roundNum, hostId } = gameState;

  const isHost = myUuid === hostId;
  const myPlayer = players.find(p => p.uuid === myUuid);
  const activePlayer = players[currentPlayerIdx];
  const topCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
  const isMyTurn = !pendingAction && activePlayer?.uuid === myUuid;
  const isMyPendingColor = pendingAction?.type === 'choose-color' && players[pendingAction.playerIdx]?.uuid === myUuid;
  const winnerPlayer = winner
    ? (players.find(p => p.uuid === winner) || lobbyPlayers.find(p => p.uuid === winner))
    : null;
  const handWinnerPlayer = winnerUuid
    ? (players.find(p => p.uuid === winnerUuid) || lobbyPlayers.find(p => p.uuid === winnerUuid))
    : null;

  // ── Header ────────────────────────────────────────────────────────────────────

  const HeaderBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48, paddingLeft: 16, paddingRight: 16, borderBottom: `1px solid ${PANEL_BORDER}`, flexShrink: 0, backgroundColor: PANEL_DARK }}>
      <button onClick={() => router.push('/uno')} style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }} onMouseEnter={e => (e.currentTarget.style.color = TEXT)} onMouseLeave={e => (e.currentTarget.style.color = TEXT_DIM)}>← Leave</button>
      <div style={{ width: 1, height: 20, backgroundColor: PANEL_BORDER }} />
      <img src="/assets/uno.svg" alt="" style={{ width: 22 }} />
      <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 16, color: TEXT }}><span style={{ color: GAME_COLOR }}>U</span>NO</span>
      {roundNum > 0 && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: TEXT_DIM, backgroundColor: SURFACE, padding: '2px 8px', borderRadius: 5, border: `1px solid ${PANEL_BORDER}` }}>Hand {roundNum}</span>}
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: TEXT_DIM, letterSpacing: '1px' }}>{code}</span>
      <button onClick={copyLink} style={{ padding: '4px 10px', border: `1px solid ${copied ? GOLD : PANEL_BORDER}`, borderRadius: 6, backgroundColor: 'transparent', fontFamily: 'Inter, sans-serif', fontSize: 11, color: copied ? GOLD : TEXT_DIM, cursor: 'pointer' }}>{copied ? 'Copied!' : 'Copy link'}</button>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: `${TEXT_DIM}66` }}>{peers === 0 ? '—' : `${peers} other${peers === 1 ? '' : 's'}`}</span>
    </div>
  );

  // ── LOBBY ─────────────────────────────────────────────────────────────────────

  if (phase === 'connecting' || phase === 'lobby') {
    const canStart = isHost && lobbyPlayers.length >= 2;
    return (
      <>
        <Head><title>Room {code} — UNO</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column' }}>
          <HeaderBar />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <img src="/assets/uno.svg" alt="" style={{ width: 44, marginBottom: 10, filter: `drop-shadow(0 0 12px ${GAME_GLOW})` }} />
                <h2 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 22, color: TEXT, margin: '0 0 4px 0' }}>
                  {phase === 'connecting' ? 'Connecting...' : 'Waiting for players'}
                </h2>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: TEXT_DIM, margin: 0 }}>Share the room code · Need 2–10 players</p>
              </div>

              <div style={{ backgroundColor: PANEL, borderRadius: 16, border: `1px solid ${PANEL_BORDER}`, padding: 20, marginBottom: 12 }}>
                {lobbyPlayers.map((p, i) => (
                  <div key={p.uuid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', backgroundColor: SURFACE, borderRadius: 10, border: `1px solid ${PANEL_BORDER}`, marginBottom: i < lobbyPlayers.length - 1 ? 6 : 0 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: TEXT, fontWeight: p.uuid === myUuid ? '700' : '400', flex: 1 }}>{p.name}</span>
                    {p.uuid === hostId && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: GAME_COLOR, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Host</span>}
                    {p.uuid === myUuid && p.uuid !== hostId && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: TEXT_DIM }}>you</span>}
                  </div>
                ))}
                {lobbyPlayers.length === 0 && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: `${TEXT_DIM}55`, textAlign: 'center', margin: 0 }}>Connecting...</p>}
              </div>

              {isHost ? (
                <button onClick={handleStartHand} disabled={!canStart}
                  style={{ width: '100%', padding: 14, backgroundColor: canStart ? GAME_COLOR : 'rgba(139,128,252,0.12)', color: canStart ? '#fff' : 'rgba(139,128,252,0.35)', border: 'none', borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: '700', cursor: canStart ? 'pointer' : 'not-allowed', boxShadow: canStart ? `0 4px 16px ${GAME_GLOW}` : 'none' }}
                >
                  {canStart ? 'Start Game →' : `Need ${Math.max(0, 2 - lobbyPlayers.length)} more player${lobbyPlayers.length < 1 ? 's' : ''}`}
                </button>
              ) : (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#8c80fc', textAlign: 'center' }}>Waiting for host to start...</p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────────────────

  if (phase === 'playing') {
    const otherPlayers = players.filter(p => p.uuid !== myUuid);
    const myIdx = players.findIndex(p => p.uuid === myUuid);

    return (
      <>
        <Head><title>Room {code} — UNO</title></Head>
        <div style={{ height: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <HeaderBar />

          {/* Other players row */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${PANEL_BORDER}`, display: 'flex', gap: 10, overflowX: 'auto', flexShrink: 0, backgroundColor: PANEL_DARK, scrollbarWidth: 'thin' }}>
            {players.filter(p => p.uuid !== myUuid).map(p => {
              const pi = players.findIndex(pl => pl.uuid === p.uuid);
              return (
                <OtherPlayer
                  key={p.uuid}
                  player={p}
                  isActive={!pendingAction && pi === currentPlayerIdx}
                  color={PLAYER_COLORS[pi % PLAYER_COLORS.length]}
                />
              );
            })}
            {otherPlayers.length === 0 && (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: `${TEXT_DIM}55`, margin: 0, alignSelf: 'center' }}>Waiting for other players...</p>
            )}
            {/* Direction indicator */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: TEXT_DIM }}>Order</span>
              <span style={{ fontSize: 16, color: TEXT_DIM }}>{direction === 1 ? '→' : '←'}</span>
            </div>
          </div>

          {/* Game table */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, backgroundColor: SURFACE, padding: '16px 24px', overflowY: 'auto' }}>
            {/* Draw pile */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div
                onClick={isMyTurn ? handleDraw : undefined}
                style={{ cursor: isMyTurn ? 'pointer' : 'default', position: 'relative' }}
              >
                {gameState.deck.length > 2 && (
                  <div style={{ position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, borderRadius: 12, backgroundColor: '#0c1530', border: `2px solid ${GAME_COLOR}22` }} />
                )}
                {gameState.deck.length > 1 && (
                  <div style={{ position: 'absolute', top: 3, left: 3, right: -3, bottom: -3, borderRadius: 12, backgroundColor: '#0e1836', border: `2px solid ${GAME_COLOR}33` }} />
                )}
                <div style={{ position: 'relative', filter: isMyTurn ? `drop-shadow(0 0 18px ${GAME_GLOW})` : 'none', transition: 'filter 0.2s', animation: isMyTurn ? 'deckPulse 2.5s ease-in-out infinite' : 'none' }}>
                  <CardBack large />
                </div>
                <div style={{ position: 'absolute', bottom: -6, right: -8, backgroundColor: GAME_COLOR, color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: '700', padding: '2px 7px', borderRadius: 10, border: `2px solid ${BG}` }}>
                  {gameState.deck.length}
                </div>
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: isMyTurn ? GAME_COLOR : TEXT_DIM, fontWeight: isMyTurn ? '700' : '400', letterSpacing: '0.3px' }}>
                {isMyTurn ? '↑ DRAW' : 'DECK'}
              </span>
            </div>

            {/* Current color + discard pile */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              {/* Color ring */}
              {currentColor && (
                <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: CARD_BG[currentColor], border: `3px solid ${CARD_BG[currentColor]}`, boxShadow: `0 0 14px ${CARD_BG[currentColor]}` }} />
              )}
              {topCard && <UnoCard card={topCard} large />}
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: TEXT_DIM }}>
                {currentColor ? COLOR_LABEL[currentColor] : '—'} active
              </span>
            </div>
          </div>

          {/* My hand + action bar */}
          <div style={{ flexShrink: 0, backgroundColor: PANEL_DARK, borderTop: `1px solid ${PANEL_BORDER}`, padding: '12px 16px 16px' }}>
            {/* Status line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {isMyTurn && !pendingAction && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: TEXT_DIM }}>
                  Your turn
                  {myPlayer && myPlayer.hand.length === 1 && (
                    <span style={{ marginLeft: 8, color: GAME_COLOR, fontWeight: '700' }}>🎴 UNO!</span>
                  )}
                </span>
              )}
              {!isMyTurn && !pendingAction && activePlayer && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: GAME_COLOR, animation: 'blink 1s infinite', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: TEXT_DIM }}>
                    <span style={{ color: TEXT, fontWeight: '700' }}>{activePlayer.name}</span> is playing...
                  </span>
                </div>
              )}
              {pendingAction?.type === 'choose-color' && !isMyPendingColor && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: TEXT_DIM }}>
                  <span style={{ color: TEXT, fontWeight: '700' }}>{players[pendingAction.playerIdx]?.name}</span> is choosing a color...
                </span>
              )}
              {isMyTurn && myPlayer && (
                <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: TEXT_DIM }}>
                  {myPlayer.hand.length} card{myPlayer.hand.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* My hand */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'thin', alignItems: 'flex-end', minHeight: 100 }}>
              {myPlayer ? myPlayer.hand.map(card => {
                const playable = isMyTurn && !pendingAction && canPlayCard(card, topCard, currentColor);
                return (
                  <UnoCard
                    key={card.id}
                    card={card}
                    playable={playable}
                    dimmed={isMyTurn && !pendingAction && !playable}
                    onClick={() => handlePlayCard(card.id)}
                  />
                );
              }) : (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: `${TEXT_DIM}55`, alignSelf: 'center' }}>Connecting...</span>
              )}
            </div>

            {/* Draw button */}
            {isMyTurn && !pendingAction && (
              <div style={{ marginTop: 6 }}>
                <button
                  onClick={handleDraw}
                  style={{ padding: '8px 20px', backgroundColor: SURFACE, border: `1px solid ${PANEL_BORDER}`, borderRadius: 8, fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: '600', color: TEXT_DIM, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = TEXT_DIM; e.currentTarget.style.color = TEXT; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = PANEL_BORDER; e.currentTarget.style.color = TEXT_DIM; }}
                >
                  Draw Card
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Color chooser overlay */}
        {isMyPendingColor && <ColorChooser onChoose={handleChooseColor} />}

        {/* Rules button + panel */}
        <button onClick={() => setShowRules(v => !v)} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 301, width: 40, height: 40, borderRadius: '50%', backgroundColor: showRules ? GAME_COLOR : PANEL, border: `2px solid ${showRules ? GAME_COLOR : PANEL_BORDER}`, color: showRules ? '#fff' : TEXT_DIM, fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'background-color 0.2s' }}>?</button>
        <RulesPanel open={showRules} onClose={() => setShowRules(false)} />

        <style>{`
          @keyframes cardAppear { from { transform: scale(0.7) rotateY(90deg); opacity: 0; } to { transform: scale(1) rotateY(0deg); opacity: 1; } }
          @keyframes deckPulse { 0%, 100% { filter: drop-shadow(0 0 8px ${GAME_GLOW}); } 50% { filter: drop-shadow(0 0 22px ${GAME_GLOW}); } }
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        `}</style>
      </>
    );
  }

  // ── HAND END ──────────────────────────────────────────────────────────────────

  if (phase === 'hand-end') {
    const sortedScores = Object.entries(cumulativeScores).sort(([, a], [, b]) => b - a);
    const handWinnerPoints = winnerUuid ? (cumulativeScores[winnerUuid] ?? 0) : 0;
    const prevHandPoints = handWinnerUuid => {
      const p = players.find(pl => pl.uuid === handWinnerUuid);
      if (!p) return 0;
      return players.filter(pl => pl.uuid !== handWinnerUuid).reduce((s, pl) => s + handPoints(pl.hand), 0);
    };

    return (
      <>
        <Head><title>Hand {roundNum} Over — UNO</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column' }}>
          <HeaderBar />
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ maxWidth: 500, width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎴</div>
                <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 28, color: TEXT, margin: '0 0 4px 0' }}>
                  {handWinnerPlayer?.name || '?'} went out!
                </h1>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: TEXT_DIM, margin: 0 }}>
                  +{prevHandPoints(winnerUuid)} points · Hand {roundNum}
                </p>
              </div>

              {/* Players' remaining hands */}
              <div style={{ backgroundColor: PANEL, borderRadius: 14, border: `1px solid ${PANEL_BORDER}`, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ padding: '10px 18px', borderBottom: `1px solid ${PANEL_BORDER}` }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: '700', color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Remaining Cards</p>
                </div>
                {players.map((p, i) => (
                  <div key={p.uuid} style={{ padding: '12px 18px', borderBottom: i < players.length - 1 ? `1px solid ${PANEL_BORDER}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: TEXT, fontWeight: p.uuid === myUuid ? '700' : '400', flex: 1 }}>{p.name}</span>
                    {p.hand.length === 0
                      ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: '700', color: GAME_COLOR, backgroundColor: `${GAME_COLOR}22`, padding: '2px 8px', borderRadius: 4 }}>UNO OUT</span>
                      : <>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200, justifyContent: 'flex-end' }}>
                            {p.hand.slice(0, 8).map(c => <UnoCard key={c.id} card={c} small />)}
                            {p.hand.length > 8 && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: TEXT_DIM, alignSelf: 'center' }}>+{p.hand.length - 8}</span>}
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: '700', color: GOLD, flexShrink: 0, minWidth: 32, textAlign: 'right' }}>+{handPoints(p.hand)}</span>
                        </>
                    }
                  </div>
                ))}
              </div>

              {/* Score leaderboard */}
              <div style={{ backgroundColor: PANEL, borderRadius: 14, border: `1px solid ${PANEL_BORDER}`, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ padding: '10px 18px', borderBottom: `1px solid ${PANEL_BORDER}` }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: '700', color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Race to 500</p>
                </div>
                {sortedScores.map(([uuid, score], i) => {
                  const p = players.find(pl => pl.uuid === uuid) || lobbyPlayers.find(pl => pl.uuid === uuid);
                  const pi = players.findIndex(pl => pl.uuid === uuid);
                  return (
                    <div key={uuid} style={{ padding: '10px 18px', borderBottom: i < sortedScores.length - 1 ? `1px solid ${PANEL_BORDER}` : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: PLAYER_COLORS[pi >= 0 ? pi % PLAYER_COLORS.length : 0] }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: uuid === myUuid ? TEXT : TEXT_DIM, fontWeight: uuid === myUuid ? '700' : '400' }}>{p?.name}</span>
                        </div>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: '700', color: score >= 400 ? GOLD : TEXT }}>{score} <span style={{ fontSize: 10, color: TEXT_DIM, fontWeight: '400' }}>/ 500</span></span>
                      </div>
                      <div style={{ height: 5, backgroundColor: SURFACE, borderRadius: 3 }}>
                        <div style={{ height: 5, backgroundColor: PLAYER_COLORS[pi >= 0 ? pi % PLAYER_COLORS.length : 0], borderRadius: 3, width: `${Math.min(score / 500, 1) * 100}%`, transition: 'width 0.7s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {isHost
                ? <button onClick={handleNextHand} style={{ width: '100%', padding: 14, backgroundColor: GAME_COLOR, color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 16px ${GAME_GLOW}` }}>Next Hand →</button>
                : <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: TEXT_DIM, textAlign: 'center' }}>Waiting for host to start next hand...</p>
              }
            </div>
          </div>
        </div>
        <button onClick={() => setShowRules(v => !v)} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 301, width: 40, height: 40, borderRadius: '50%', backgroundColor: showRules ? GAME_COLOR : PANEL, border: `2px solid ${showRules ? GAME_COLOR : PANEL_BORDER}`, color: showRules ? '#fff' : TEXT_DIM, fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'background-color 0.2s' }}>?</button>
        <RulesPanel open={showRules} onClose={() => setShowRules(false)} />
      </>
    );
  }

  // ── GAME OVER ─────────────────────────────────────────────────────────────────

  if (phase === 'game-over') {
    const sortedScores = Object.entries(cumulativeScores).sort(([, a], [, b]) => b - a);
    return (
      <>
        <Head><title>Game Over — UNO</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column' }}>
          <HeaderBar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
            <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
              <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 36, color: GOLD, margin: '0 0 6px 0' }}>{winnerPlayer?.name || '?'}</h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: TEXT_DIM, margin: '0 0 32px 0' }}>reached 500 in Hand {roundNum}</p>

              <div style={{ backgroundColor: PANEL, borderRadius: 14, border: `1px solid ${PANEL_BORDER}`, overflow: 'hidden', marginBottom: 24 }}>
                {sortedScores.map(([uuid, score], i) => {
                  const p = players.find(pl => pl.uuid === uuid) || lobbyPlayers.find(pl => pl.uuid === uuid);
                  const pi = players.findIndex(pl => pl.uuid === uuid);
                  return (
                    <div key={uuid} style={{ padding: '14px 18px', borderBottom: i < sortedScores.length - 1 ? `1px solid ${PANEL_BORDER}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 18, fontWeight: '800', color: i === 0 ? GOLD : TEXT_DIM, width: 28, flexShrink: 0, textAlign: 'left' }}>
                        {['🥇', '🥈', '🥉'][i] || `${i + 1}.`}
                      </span>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: PLAYER_COLORS[pi >= 0 ? pi % PLAYER_COLORS.length : 0], flexShrink: 0 }} />
                      <span style={{ flex: 1, fontFamily: 'Inter, sans-serif', fontSize: 14, color: TEXT, fontWeight: uuid === myUuid ? '700' : '400', textAlign: 'left' }}>
                        {p?.name}{uuid === myUuid ? ' (you)' : ''}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: '800', color: i === 0 ? GOLD : TEXT, flexShrink: 0 }}>{score}</span>
                    </div>
                  );
                })}
              </div>

              {isHost
                ? <button onClick={handlePlayAgain} style={{ width: '100%', padding: 14, backgroundColor: GAME_COLOR, color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 16px ${GAME_GLOW}` }}>Play Again →</button>
                : <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: TEXT_DIM }}>Waiting for host to start a new game...</p>
              }
            </div>
          </div>
        </div>
        <button onClick={() => setShowRules(v => !v)} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 301, width: 40, height: 40, borderRadius: '50%', backgroundColor: showRules ? GAME_COLOR : PANEL, border: `2px solid ${showRules ? GAME_COLOR : PANEL_BORDER}`, color: showRules ? '#fff' : TEXT_DIM, fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'background-color 0.2s' }}>?</button>
        <RulesPanel open={showRules} onClose={() => setShowRules(false)} />
      </>
    );
  }

  return null;
}
