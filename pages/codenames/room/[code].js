import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import Board from '../../../components/games/codenames/board/Board';
import GameHUD from '../../../components/games/codenames/hud/GameHUD';
import ClueInput from '../../../components/games/codenames/hud/ClueInput';
import {
  startGame, submitClue, revealCard, endTurn,
  leaveGame, volunteerAsSpymaster, forfeitByTimeout,
  recordTeamVote, resolveGridVote,
  voteRematch, triggerRematch, requeueToLobby,
} from '../../../lib/games/codenames/state';
import PlayerBar from '../../../components/games/codenames/hud/PlayerBar';
import RulesModal from '../../../components/games/codenames/ui/RulesModal';
import ActivityLog from '../../../components/games/codenames/ui/ActivityLog';

const TEAM_COLORS = { red: '#DC2626', blue: '#2563EB' };
const TEAM_BG     = { red: '#FEE2E2', blue: '#DBEAFE' };
const TEAM_LIGHT  = { red: '#FFF5F5', blue: '#EFF6FF' };

export default function CodenamesRoom() {
  const router = useRouter();
  const { code } = router.query;

  const [myUuid, setMyUuid]           = useState(null);
  const [players, setPlayers]         = useState([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [countdown, setCountdown]     = useState(null);
  const [notFound, setNotFound]       = useState(false);
  const [roomConfirmed, setRoomConfirmed] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [gameState, setGameState]     = useState({
    phase: 'connecting',
    currentTeam: null,
    firstTeam: null,
    clueWord: '',
    clueNumber: 0,
    guessesLeft: 0,
    winner: null,
    winReason: null,
    words: [],
    keyCard: [],
    revealed: Array(25).fill(false),
    redRemaining: 0,
    blueRemaining: 0,
    hostId: null,
    spymasterNeededTeam: null,
    spymasterNeededDeadline: null,
    gridRedReady:    false,
    gridBlueReady:   false,
    gridRedVetoUsed: false,
    gridBlueVetoUsed:false,
    gridRedAction:   null,
    gridBlueAction:  null,
    rematchVotes:    [],
  });

  const [activityLog, setActivityLog] = useState([]);

  const metaRef      = useRef(null);
  const yPlayersRef  = useRef(null);
  const yRevealedRef = useRef(null);
  const logStateRef  = useRef(null);

  // ── Setup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!code || typeof window === 'undefined') return;

    const stored = localStorage.getItem('poordown_identity');
    const identity = stored ? JSON.parse(stored) : null;
    if (!identity) { router.push('/'); return; }
    setMyUuid(identity.uuid);

    const hostFlag = new URLSearchParams(window.location.search).get('host') === 'true';

    const doc       = new Y.Doc();
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || 'ws://localhost:4444';
    const provider  = new WebrtcProvider(`poordown-codenames-${code}`, doc, {
      signaling: [signalingUrl],
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
      maxConns: 8,
    });

    provider.awareness.setLocalStateField('player', { uuid: identity.uuid });
    provider.awareness.on('change', () => {
      const peers = Array.from(provider.awareness.getStates().values())
        .filter(s => s.player?.uuid && s.player.uuid !== identity.uuid);
      if (peers.length > 0) setRoomConfirmed(true);
    });
    const meta      = doc.getMap('meta');
    const yPlayers  = doc.getArray('players');
    const yRevealed = doc.getMap('revealed');

    metaRef.current      = meta;
    yPlayersRef.current  = yPlayers;
    yRevealedRef.current = yRevealed;

    const syncState = () => {
      const wordsRaw = meta.get('words');
      const keyRaw   = meta.get('keyCard');
      const phase    = meta.get('phase');
      setGameState({
        phase:                  phase || (hostFlag ? 'lobby' : 'connecting'),
        currentTeam:            meta.get('currentTeam')            || null,
        firstTeam:              meta.get('firstTeam')              || null,
        clueWord:               meta.get('clueWord')               || '',
        clueNumber:             meta.get('clueNumber')             ?? 0,
        guessesLeft:            meta.get('guessesLeft')            ?? 0,
        winner:                 meta.get('winner')                 || null,
        winReason:              meta.get('winReason')              || null,
        words:                  wordsRaw ? JSON.parse(wordsRaw) : [],
        keyCard:                keyRaw   ? JSON.parse(keyRaw)   : [],
        revealed:               Array.from({ length: 25 }, (_, i) => yRevealed.get(String(i)) || false),
        redRemaining:           meta.get('redRemaining')           ?? 0,
        blueRemaining:          meta.get('blueRemaining')          ?? 0,
        hostId:                 meta.get('hostId')                 || null,
        spymasterNeededTeam:    meta.get('spymasterNeededTeam')    || null,
        spymasterNeededDeadline:meta.get('spymasterNeededDeadline')|| null,
        gridRedReady:           meta.get('gridRedReady')           ?? false,
        gridBlueReady:          meta.get('gridBlueReady')          ?? false,
        gridRedVetoUsed:        meta.get('gridRedVetoUsed')        ?? false,
        gridBlueVetoUsed:       meta.get('gridBlueVetoUsed')       ?? false,
        gridRedAction:          meta.get('gridRedAction')          || null,
        gridBlueAction:         meta.get('gridBlueAction')         || null,
        rematchVotes:           JSON.parse(meta.get('rematchVotes') || '[]'),
      });
    };

    const syncPlayers = () => setPlayers(yPlayers.toArray());

    meta.observe(syncState);
    yRevealed.observe(syncState);
    yPlayers.observe(syncPlayers);

    const timer = setTimeout(() => {
      if (hostFlag && !meta.get('phase')) {
        meta.set('phase', 'lobby');
        meta.set('hostId', identity.uuid);
      }
      const existing = yPlayers.toArray().find(p => p.uuid === identity.uuid);
      if (!existing) {
        yPlayers.push([{ uuid: identity.uuid, name: identity.name, team: null, role: null, joinedAt: Date.now() }]);
      }
      syncState();
      syncPlayers();
    }, 500);

    return () => {
      clearTimeout(timer);
      meta.unobserve(syncState);
      yRevealed.unobserve(syncState);
      yPlayers.unobserve(syncPlayers);
      provider.destroy();
      doc.destroy();
    };
  }, [code]);

  // ── Room-not-found timeout ────────────────────────────────────────────────
  useEffect(() => {
    if (gameState.phase !== 'connecting' || roomConfirmed) return;
    const t = setTimeout(() => setNotFound(true), 30000);
    return () => clearTimeout(t);
  }, [gameState.phase, roomConfirmed]);

  // ── Countdown timer for spymaster-needed ──────────────────────────────────
  useEffect(() => {
    const { phase, spymasterNeededTeam, spymasterNeededDeadline } = gameState;
    if (phase !== 'spymaster-needed' || !spymasterNeededDeadline) {
      setCountdown(null);
      return;
    }
    const tick = () => {
      const secs = Math.max(0, Math.ceil((spymasterNeededDeadline - Date.now()) / 1000));
      setCountdown(secs);
      if (secs <= 0) forfeitByTimeout(metaRef.current, spymasterNeededTeam);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [gameState.phase, gameState.spymasterNeededDeadline, gameState.spymasterNeededTeam]);

  // ── Host: resolve grid veto when both teams have voted ────────────────────
  useEffect(() => {
    const amHost = gameState.hostId === myUuid;
    if (!amHost || gameState.phase !== 'grid-veto') return;
    if (gameState.gridRedReady && gameState.gridBlueReady) {
      resolveGridVote(metaRef.current, yRevealedRef.current);
    }
  }, [gameState.hostId, myUuid, gameState.phase, gameState.gridRedReady, gameState.gridBlueReady]);

  // ── Host: trigger rematch when 2+2 votes are reached ─────────────────────
  useEffect(() => {
    const amHost = gameState.hostId === myUuid;
    if (!amHost || gameState.phase !== 'over') return;
    const votes     = gameState.rematchVotes;
    const redVotes  = votes.filter(id => players.some(p => p.uuid === id && p.team === 'red')).length;
    const blueVotes = votes.filter(id => players.some(p => p.uuid === id && p.team === 'blue')).length;
    if (redVotes >= 2 && blueVotes >= 2) {
      triggerRematch(metaRef.current, yPlayersRef.current, yRevealedRef.current);
    }
  }, [gameState.hostId, myUuid, gameState.phase, gameState.rematchVotes, players]);

  // ── Activity log ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameState.words.length) return;

    const prev = logStateRef.current;
    const curr = gameState;

    if (!prev) {
      logStateRef.current = { ...curr, revealed: [...curr.revealed] };
      return;
    }

    const newEntries = [];

    if (curr.clueWord && curr.clueWord !== prev.clueWord) {
      const emoji = curr.currentTeam === 'red' ? '🔴' : '🔵';
      const num   = curr.clueNumber === 0 ? '∞' : curr.clueNumber;
      newEntries.push(`${emoji} Clue: "${curr.clueWord}", ${num}`);
    }

    curr.revealed.forEach((r, i) => {
      if (r && !prev.revealed[i]) {
        const type  = curr.keyCard[i];
        const word  = curr.words[i];
        const label = { red: 'Red agent ✓', blue: 'Blue agent ✓', neutral: 'Neutral', assassin: 'Assassin 💀' }[type];
        const icon  = { red: '🔴', blue: '🔵', neutral: '⬜', assassin: '⚫' }[type];
        newEntries.push(`${icon} ${word} — ${label}`);
      }
    });

    if (prev.phase === 'operatives-guess' && curr.phase === 'spymaster-clue' && prev.currentTeam && !newEntries.some(e => e.includes('Clue:'))) {
      const emoji = prev.currentTeam === 'red' ? '🔴' : '🔵';
      newEntries.push(`${emoji} Turn ended`);
    }

    if (curr.phase === 'over' && prev.phase !== 'over' && curr.winner) {
      const label = curr.winner === 'red' ? 'Red' : 'Blue';
      const icon  = curr.winReason === 'assassin' ? '💀' : '🎉';
      newEntries.push(`${icon} ${label} team wins!`);
    }

    if (newEntries.length > 0) {
      setActivityLog(log => [
        ...log.slice(-30),
        ...newEntries.map((msg, j) => ({ id: Date.now() + j, msg })),
      ]);
    }

    logStateRef.current = { ...curr, revealed: [...curr.revealed] };
  }, [gameState]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const myPlayer = players.find(p => p.uuid === myUuid);
  const myTeam   = myPlayer?.team || null;
  const myRole   = myPlayer?.role || null;
  const isHost   = gameState.hostId === myUuid;

  const {
    phase, currentTeam, words, keyCard, revealed, clueWord, clueNumber,
    guessesLeft, winner, winReason, redRemaining, blueRemaining,
    spymasterNeededTeam, gridRedReady, gridBlueReady,
    gridRedVetoUsed, gridBlueVetoUsed, gridRedAction, gridBlueAction,
    rematchVotes,
  } = gameState;

  const isCurrentTeam   = myTeam === currentTeam;
  const isSpymasterTurn = phase === 'spymaster-clue'   && isCurrentTeam && myRole === 'spymaster';
  const isOperativeTurn = phase === 'operatives-guess' && isCurrentTeam && myRole === 'operative';
  const isSpymasterView = myRole === 'spymaster';
  const canVolunteer    = phase === 'spymaster-needed' && myTeam === spymasterNeededTeam && myRole === 'operative';

  const devMode = router.query.dev === 'true';

  const canStart = () => {
    if (devMode) {
      return players.filter(p => p.team === 'red'  && p.role).length >= 1
          && players.filter(p => p.team === 'blue' && p.role).length >= 1;
    }
    const rs = players.filter(p => p.team === 'red'  && p.role === 'spymaster').length;
    const ro = players.filter(p => p.team === 'red'  && p.role === 'operative').length;
    const bs = players.filter(p => p.team === 'blue' && p.role === 'spymaster').length;
    const bo = players.filter(p => p.team === 'blue' && p.role === 'operative').length;
    return rs >= 1 && ro >= 1 && bs >= 1 && bo >= 1;
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const assignSelf = (team, role) => {
    const arr = yPlayersRef.current.toArray();
    const idx = arr.findIndex(p => p.uuid === myUuid);
    if (idx !== -1) {
      yPlayersRef.current.delete(idx, 1);
      yPlayersRef.current.insert(idx, [{ ...arr[idx], team, role }]);
    }
  };

  const handleStartGame  = () => startGame(metaRef.current, yRevealedRef.current);
  const handleSubmitClue = (word, number) => submitClue(metaRef.current, word, number);
  const handlePass       = () => endTurn(metaRef.current);
  const handleVolunteer  = () => volunteerAsSpymaster(metaRef.current, yPlayersRef.current, myUuid);

  const handleCardClick = (index) => {
    if (!isOperativeTurn || revealed[index]) return;
    setSelectedCard(prev => prev === index ? null : index);
  };

  const handleConfirmCard = () => {
    if (selectedCard === null) return;
    revealCard(metaRef.current, yRevealedRef.current, selectedCard);
    setSelectedCard(null);
  };

  const handleVoteGrid = (action) => {
    if (!myTeam) return;
    recordTeamVote(metaRef.current, myTeam, action);
  };

  const handleVoteRematch = () => voteRematch(metaRef.current, myUuid);

  const handleRequeue = () => requeueToLobby(metaRef.current, yPlayersRef.current);

  const handleLeaveGame = () => {
    localStorage.removeItem('poordown_active_room');
    leaveGame(metaRef.current, yPlayersRef.current, myUuid);
    router.push('/codenames');
  };

  // ── Shared leave button (shown in game phases) ────────────────────────────
  const LeaveButton = () => (
    <button
      onClick={() => setShowLeaveConfirm(true)}
      style={{
        background: 'none',
        border: 'none',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#C8C4B8',
        cursor: 'pointer',
        padding: '4px 8px',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#E63946')}
      onMouseLeave={e => (e.currentTarget.style.color = '#C8C4B8')}
    >
      Leave game
    </button>
  );

  // ── Leave confirm dialog ──────────────────────────────────────────────────
  const LeaveConfirmOverlay = () => (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white', borderRadius: '16px',
          padding: '32px 28px', maxWidth: '360px', width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚪</div>
        <h3 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '800', color: '#2B2D42', margin: '0 0 10px' }}>
          Leave game?
        </h3>
        {myRole === 'spymaster' && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#E63946', margin: '0 0 8px', lineHeight: 1.5 }}>
            ⚠️ You're the spymaster — your team will need to elect a replacement or forfeit.
          </p>
        )}
        {myRole === 'operative' && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', margin: '0 0 8px', lineHeight: 1.5 }}>
            If you're the last operative on your team, your team forfeits.
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setShowLeaveConfirm(false)}
            style={{
              padding: '10px 22px', borderRadius: '10px',
              border: '2px solid #E8E4D8', backgroundColor: 'white',
              fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '600',
              color: '#2B2D42', cursor: 'pointer',
            }}
          >
            Stay
          </button>
          <button
            onClick={handleLeaveGame}
            style={{
              padding: '10px 22px', borderRadius: '10px',
              border: 'none', backgroundColor: '#E63946',
              fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '700',
              color: 'white', cursor: 'pointer',
            }}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );

  // ── Spymaster-needed overlay ──────────────────────────────────────────────
  const SpymasterNeededOverlay = () => {
    const neededColor = spymasterNeededTeam ? TEAM_COLORS[spymasterNeededTeam] : '#2B2D42';
    const neededLabel = spymasterNeededTeam === 'red' ? 'Red' : 'Blue';
    const urgency = countdown !== null && countdown <= 15;

    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 150, padding: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: 'white', borderRadius: '20px',
            padding: '40px 32px', maxWidth: '400px', width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.35)', textAlign: 'center',
            border: `3px solid ${neededColor}`,
          }}
        >
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>🕵️</div>
          <h3 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '800', color: neededColor, margin: '0 0 8px' }}>
            {neededLabel} team needs a spymaster!
          </h3>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8D99AE', margin: '0 0 20px', lineHeight: 1.5 }}>
            Their spymaster left the game. An operative must volunteer to take over — they'll see the key card going forward.
          </p>

          {countdown !== null && (
            <div
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '40px',
                fontWeight: '800',
                color: urgency ? '#E63946' : '#2B2D42',
                marginBottom: '20px',
                transition: 'color 0.3s',
              }}
            >
              {countdown}s
            </div>
          )}

          {canVolunteer ? (
            <button
              onClick={handleVolunteer}
              style={{
                padding: '12px 32px', borderRadius: '12px',
                border: 'none', backgroundColor: neededColor,
                fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: '700',
                color: 'white', cursor: 'pointer',
              }}
            >
              Volunteer as Spymaster
            </button>
          ) : (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', fontStyle: 'italic' }}>
              {myTeam === spymasterNeededTeam
                ? 'You are already the spymaster.'
                : `Waiting for ${neededLabel} team to decide...`}
            </p>
          )}

          {countdown === 0 && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#E63946', marginTop: '12px' }}>
              Time's up — forfeiting...
            </p>
          )}
        </div>
      </div>
    );
  };

  // ── Lobby TeamColumn helper ───────────────────────────────────────────────
  const TeamColumn = ({ team }) => {
    const spymasters = players.filter(p => p.team === team && p.role === 'spymaster');
    const operatives = players.filter(p => p.team === team && p.role === 'operative');
    const color = TEAM_COLORS[team];
    const bg    = TEAM_BG[team];
    const label = team === 'red' ? 'Red Team' : 'Blue Team';
    const iAmSpymaster = myTeam === team && myRole === 'spymaster';
    const iAmOperative = myTeam === team && myRole === 'operative';

    const slotBtn = (role, label) => (
      <button
        onClick={() => assignSelf(team, role)}
        style={{
          marginTop: '8px', padding: '6px 14px', borderRadius: '8px',
          border: `1.5px solid ${color}`, backgroundColor: 'white', color,
          fontSize: '12px', fontWeight: '600', fontFamily: 'Inter, sans-serif',
          cursor: 'pointer', transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = bg; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
      >
        {label}
      </button>
    );

    const playerRow = (p) => (
      <div key={p.uuid} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: p.uuid === myUuid ? '700' : '400', color: '#2B2D42' }}>
          {p.name}{p.uuid === myUuid ? ' (you)' : ''}
        </span>
      </div>
    );

    return (
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: myTeam === team ? `2px solid ${color}` : '2px solid transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '18px', fontWeight: '800', color: '#2B2D42' }}>{label}</span>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Spymaster</p>
          {spymasters.length > 0 ? spymasters.map(playerRow) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#C8C4B8', fontStyle: 'italic' }}>No spymaster yet</span>
          )}
          {!iAmSpymaster && slotBtn('spymaster', 'Join as Spymaster')}
        </div>

        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Operatives</p>
          {operatives.length > 0 ? operatives.map(playerRow) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#C8C4B8', fontStyle: 'italic' }}>No operatives yet</span>
          )}
          {!iAmOperative && slotBtn('operative', 'Join as Operative')}
        </div>
      </div>
    );
  };

  // ── Phase: connecting ─────────────────────────────────────────────────────
  if (phase === 'connecting') {
    if (notFound) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8F4E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '800', color: '#2B2D42', margin: '0 0 8px' }}>
              Room not found
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#8D99AE', margin: '0 0 28px', lineHeight: 1.5 }}>
              No one is hosting room <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: '#2B2D42' }}>{code}</span>.<br />
              Check the room code and try again.
            </p>
            <button
              onClick={() => router.push('/codenames')}
              style={{
                padding: '12px 28px', borderRadius: '12px', border: 'none',
                backgroundColor: '#7C3AED', color: 'white',
                fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ← Back to Codenames
            </button>
          </div>
        </div>
      );
    }
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F4E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#8D99AE', fontSize: '16px' }}>
          Connecting to room {code}...
        </p>
      </div>
    );
  }

  // ── Phase: grid-veto ──────────────────────────────────────────────────────
  if (phase === 'grid-veto') {
    const myVoted    = myTeam === 'red' ? gridRedReady    : gridBlueReady;
    const myVetoUsed = myTeam === 'red' ? gridRedVetoUsed : gridBlueVetoUsed;
    const oppVoted   = myTeam === 'red' ? gridBlueReady   : gridRedReady;

    const VoteStatus = ({ voted, action, label, color }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2B2D42', fontWeight: '600' }}>{label}:</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: voted ? (action === 'veto' ? '#E63946' : '#2D6A4F') : '#8D99AE', fontStyle: voted ? 'normal' : 'italic' }}>
          {voted ? (action === 'veto' ? 'Requesting new grid' : 'Looks good') : 'Deciding...'}
        </span>
      </div>
    );

    return (
      <>
        <Head><title>Codenames — Grid Veto — {code}</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: '#F8F4E8', display: 'flex', flexDirection: 'column' }}>
          <PlayerBar players={players} myUuid={myUuid} phase={phase} currentTeam={currentTeam} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '800', color: '#2B2D42', margin: '0 0 4px' }}>
                Grid Veto
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', margin: 0 }}>
                Both teams must approve this board before the game begins.
                {(gridRedVetoUsed || gridBlueVetoUsed) && ' (each team gets one veto)'}
              </p>
            </div>

            {/* Board — words only, no colors during veto */}
            <Board
              words={words}
              keyCard={keyCard}
              revealed={revealed}
              isSpymaster={false}
              isClickable={false}
              onCardClick={() => {}}
              selectedCard={null}
              showAll={false}
            />

            {/* Vote controls */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', maxWidth: '480px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <VoteStatus voted={gridRedReady}  action={gridRedAction}  label="Red team"  color="#DC2626" />
              <VoteStatus voted={gridBlueReady} action={gridBlueAction} label="Blue team" color="#2563EB" />

              {myTeam && !myVoted && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', paddingTop: '8px', borderTop: '1px solid #F0EDE6' }}>
                  <button
                    onClick={() => handleVoteGrid('approve')}
                    style={{ padding: '10px 22px', backgroundColor: '#2D6A4F', color: 'white', border: 'none', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#245A42'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2D6A4F'; }}
                  >
                    Looks good ✓
                  </button>
                  {!myVetoUsed && (
                    <button
                      onClick={() => handleVoteGrid('veto')}
                      style={{ padding: '10px 22px', backgroundColor: 'white', color: '#E63946', border: '2px solid #E63946', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFF5F5'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                    >
                      Request new grid ↻
                    </button>
                  )}
                </div>
              )}

              {myTeam && myVoted && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', textAlign: 'center', margin: 0, paddingTop: '8px', borderTop: '1px solid #F0EDE6' }}>
                  {oppVoted ? 'Resolving...' : 'Waiting for the other team...'}
                </p>
              )}

              {!myTeam && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', textAlign: 'center', margin: 0, paddingTop: '8px', borderTop: '1px solid #F0EDE6' }}>
                  You're watching — teams are voting on this grid.
                </p>
              )}

              {/* Show unused veto hint */}
              {myTeam && !myVoted && myVetoUsed && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8D99AE', textAlign: 'center', margin: '-8px 0 0' }}>
                  Your team used its veto on the previous grid.
                </p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Phase: lobby ──────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    const unassigned = players.filter(p => !p.team || !p.role);
    const ready = canStart();

    return (
      <>
        <Head><title>Codenames Lobby — {code}</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: '#F8F4E8', padding: '32px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '760px', margin: '0 auto 32px' }}>
            <button
              onClick={() => router.push('/codenames')}
              style={{ background: 'none', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8D99AE', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ← Back
            </button>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '32px', fontWeight: '800', color: '#2B2D42', margin: 0, letterSpacing: '-0.5px' }}>
                Code<span style={{ color: '#DC2626' }}>names</span>
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', margin: '4px 0 0' }}>
                Room&nbsp;<span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: '#2B2D42', letterSpacing: '2px' }}>{code}</span>
              </p>
              {devMode && (
                <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 10px', backgroundColor: '#FEF9C3', border: '1px solid #FCD34D', borderRadius: '20px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '700', color: '#92400E', letterSpacing: '0.5px' }}>
                  DEV MODE — reduced player requirements
                </span>
              )}
            </div>
            <div style={{ width: '48px' }} />
          </div>

          <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <TeamColumn team="red" />
            <TeamColumn team="blue" />
          </div>

          {unassigned.length > 0 && (
            <div style={{ maxWidth: '760px', margin: '20px auto 0', padding: '16px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '700', color: '#8D99AE', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>Not yet assigned</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {unassigned.map(p => (
                  <span key={p.uuid} style={{ padding: '4px 12px', backgroundColor: '#F5F0E8', borderRadius: '20px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2B2D42' }}>
                    {p.name}{p.uuid === myUuid ? ' (you)' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ maxWidth: '760px', margin: '24px auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {isHost ? (
              <>
                <button
                  onClick={handleStartGame}
                  disabled={!ready}
                  style={{
                    padding: '14px 40px', backgroundColor: ready ? '#2D6A4F' : '#8D99AE',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontSize: '16px', fontWeight: '700', fontFamily: 'Inter, sans-serif',
                    cursor: ready ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => { if (ready) e.currentTarget.style.backgroundColor = '#245A42'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = ready ? '#2D6A4F' : '#8D99AE'; }}
                >
                  Start Game
                </button>
                {!ready && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8D99AE', margin: 0 }}>
                    {devMode
                      ? 'Each team needs at least 1 player with any role.'
                      : 'Each team needs at least 1 spymaster and 1 operative.'}
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE' }}>
                Waiting for host to start the game...
              </p>
            )}
          </div>
        </div>
        <RulesModal />
      </>
    );
  }

  // ── Phase: game (spymaster-clue | operatives-guess | spymaster-needed | over) ─
  const winnerColor = winner ? TEAM_COLORS[winner] : '#2B2D42';
  const winnerLabel = winner === 'red' ? 'Red Team' : 'Blue Team';
  const gameOverIcon =
    winReason === 'assassin' ? '💀' :
    winReason === 'forfeit'  ? '🚪' : '🎉';
  const gameOverMsg =
    winReason === 'assassin' ? 'The assassin was revealed — instant loss.' :
    winReason === 'forfeit'  ? 'The other team left the game.' :
    'All agents found first!';

  const redVoteCount  = rematchVotes.filter(id => players.some(p => p.uuid === id && p.team === 'red')).length;
  const blueVoteCount = rematchVotes.filter(id => players.some(p => p.uuid === id && p.team === 'blue')).length;
  const myRematchVote = rematchVotes.includes(myUuid);

  return (
    <>
      <Head><title>Codenames — {code}</title></Head>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8F4E8' }}>

        <GameHUD
          phase={phase}
          currentTeam={currentTeam}
          clueWord={clueWord}
          clueNumber={clueNumber}
          guessesLeft={guessesLeft}
          redRemaining={redRemaining}
          blueRemaining={blueRemaining}
        />

        <PlayerBar players={players} myUuid={myUuid} phase={phase} currentTeam={currentTeam} />

        {/* Game-over banner — non-blocking so the board stays visible */}
        {phase === 'over' && winner && (
          <div style={{ backgroundColor: winnerColor, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '18px', fontWeight: '800', color: 'white' }}>
              {gameOverIcon} {winnerLabel} wins! — {gameOverMsg}
            </span>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: '20px' }}>

          {isSpymasterView && phase !== 'over' && (
            <div style={{ padding: '8px 18px', backgroundColor: TEAM_LIGHT[myTeam] || '#F5F0E8', border: `1.5px solid ${TEAM_COLORS[myTeam] || '#8D99AE'}`, borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', color: TEAM_COLORS[myTeam] || '#2B2D42' }}>
              👁 Spymaster view — don't show your screen to your team!
            </div>
          )}

          {myTeam && !isCurrentTeam && phase === 'operatives-guess' && (
            <div style={{ padding: '8px 18px', backgroundColor: 'white', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              Waiting for {currentTeam === 'red' ? '🔴 Red' : '🔵 Blue'} team...
            </div>
          )}

          {myTeam && !isCurrentTeam && phase === 'spymaster-clue' && (
            <div style={{ padding: '8px 18px', backgroundColor: 'white', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {currentTeam === 'red' ? '🔴 Red' : '🔵 Blue'} spymaster is thinking...
            </div>
          )}

          <Board
            words={words}
            keyCard={keyCard}
            revealed={revealed}
            isSpymaster={isSpymasterView && phase !== 'over'}
            isClickable={isOperativeTurn}
            onCardClick={handleCardClick}
            selectedCard={selectedCard}
            showAll={phase === 'over'}
          />

          <ActivityLog entries={activityLog} />

          {isSpymasterTurn && (
            <ClueInput currentTeam={currentTeam} onSubmit={handleSubmitClue} />
          )}

          {isOperativeTurn && (
            <button
              onClick={handlePass}
              style={{
                padding: '10px 24px', backgroundColor: 'white',
                border: `2px solid ${TEAM_COLORS[currentTeam]}`, borderRadius: '10px',
                fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '600',
                color: TEAM_COLORS[currentTeam], cursor: 'pointer', transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = TEAM_BG[currentTeam]; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
            >
              Pass Turn
            </button>
          )}

          {!myRole && phase !== 'over' && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE' }}>
              You're watching — you weren't assigned a role before the game started.
            </p>
          )}

          {/* Post-game actions */}
          {phase === 'over' && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px', maxWidth: '480px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Rematch voting */}
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#8D99AE', margin: '0 0 8px' }}>
                  Rematch — need 2 from each team
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleVoteRematch}
                    disabled={myRematchVote}
                    style={{ padding: '8px 18px', backgroundColor: myRematchVote ? '#F5F0E8' : '#2D6A4F', color: myRematchVote ? '#8D99AE' : 'white', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '700', cursor: myRematchVote ? 'default' : 'pointer' }}
                  >
                    {myRematchVote ? 'Voted ✓' : 'Vote Rematch'}
                  </button>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE' }}>
                    🔴 {redVoteCount}/2 &nbsp; 🔵 {blueVoteCount}/2
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F0EDE6', paddingTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {isHost && (
                  <button
                    onClick={handleRequeue}
                    style={{ padding: '9px 20px', backgroundColor: 'white', color: '#2B2D42', border: '2px solid #E8E4D8', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2B2D42'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E4D8'; }}
                  >
                    ← Back to Lobby
                  </button>
                )}
                <button
                  onClick={() => { localStorage.removeItem('poordown_active_room'); router.push('/codenames'); }}
                  style={{ padding: '9px 20px', backgroundColor: 'white', color: '#E63946', border: '2px solid #FECDD3', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#E63946'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#FECDD3'; }}
                >
                  Leave Room
                </button>
              </div>
            </div>
          )}

          {phase !== 'over' && <LeaveButton />}
        </div>

        {/* Card confirmation bar */}
        {selectedCard !== null && isOperativeTurn && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '2px solid #7C3AED', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 50, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#2B2D42' }}>
              Guess <strong style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '1px', color: '#7C3AED' }}>{words[selectedCard]}</strong>?
            </span>
            <button
              onClick={handleConfirmCard}
              style={{ padding: '9px 22px', backgroundColor: '#7C3AED', color: 'white', border: 'none', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#6D28D9'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#7C3AED'; }}
            >
              Confirm
            </button>
            <button
              onClick={() => setSelectedCard(null)}
              style={{ padding: '9px 16px', backgroundColor: 'white', color: '#8D99AE', border: '1.5px solid #E8E4D8', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Spymaster-needed overlay */}
        {phase === 'spymaster-needed' && <SpymasterNeededOverlay />}

        {/* Leave confirm dialog */}
        {showLeaveConfirm && <LeaveConfirmOverlay />}

        <RulesModal />
      </div>
    </>
  );
}
