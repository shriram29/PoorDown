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

const TEAM_COLORS = { red: '#EF4444', blue: '#3B82F6' };  // vivid on dark bg
const TEAM_VIVID  = { red: '#F87171', blue: '#60A5FA' };  // text on dark
const TEAM_SURFACE= { red: '#2D1212', blue: '#0D1929' };
const TEAM_BORDER = { red: '#7F1D1D', blue: '#1E3A5F' };

// Dark theme tokens
const D = {
  bg:       '#0D1117',
  surface:  '#161B22',
  surface2: '#1C2128',
  border:   '#30363D',
  border2:  '#21262D',
  text:     '#E6EDF3',
  sub:      '#8B949E',
  muted:    '#484F58',
};

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
        color: D.muted,
        cursor: 'pointer',
        padding: '4px 8px',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
      onMouseLeave={e => (e.currentTarget.style.color = D.muted)}
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
    const spymasters   = players.filter(p => p.team === team && p.role === 'spymaster');
    const operatives   = players.filter(p => p.team === team && p.role === 'operative');
    const vivid        = TEAM_VIVID[team];
    const surface      = TEAM_SURFACE[team];
    const border       = TEAM_BORDER[team];
    const isMine       = myTeam === team;
    const iAmSpymaster = isMine && myRole === 'spymaster';
    const iAmOperative = isMine && myRole === 'operative';
    const agentCount   = spymasters.length + operatives.length;

    const AgentCard = ({ p, role }) => (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px',
        backgroundColor: D.bg,
        border: `1px solid ${p.uuid === myUuid ? border : D.border2}`,
        borderRadius: '10px',
        marginBottom: '6px',
        boxShadow: p.uuid === myUuid ? `inset 0 0 0 1px ${vivid}33` : 'none',
      }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: surface, border: `1.5px solid ${vivid}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Nunito, sans-serif', fontSize: '13px', fontWeight: '800', color: vivid,
        }}>
          {p.name[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: p.uuid === myUuid ? '700' : '500', color: p.uuid === myUuid ? D.text : D.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name}{p.uuid === myUuid ? ' (you)' : ''}
          </div>
        </div>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: vivid, opacity: 0.6, flexShrink: 0 }}>
          {role === 'spymaster' ? 'SPY' : 'OP'}
        </span>
      </div>
    );

    const JoinSlot = ({ role }) => (
      <button
        onClick={() => assignSelf(team, role)}
        style={{
          width: '100%', padding: '9px 12px',
          border: `1.5px dashed ${border}`, borderRadius: '10px', marginBottom: '6px',
          display: 'flex', alignItems: 'center', gap: '10px',
          backgroundColor: 'transparent', cursor: 'pointer',
          transition: 'background-color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = surface; e.currentTarget.style.borderColor = vivid; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = border; }}
      >
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
          border: `1.5px dashed ${vivid}`, opacity: 0.6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: vivid, fontSize: '18px', lineHeight: 1,
        }}>+</div>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600', color: vivid, opacity: 0.8 }}>
          {role === 'spymaster' ? 'Claim spymaster' : 'Join as operative'}
        </span>
      </button>
    );

    return (
      <div style={{
        backgroundColor: D.surface,
        border: isMine ? `2px solid ${border}` : `1px solid ${D.border2}`,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: isMine ? `0 0 40px ${vivid}18` : 'none',
        transition: 'box-shadow 0.4s',
      }}>
        {/* Team header */}
        <div style={{
          background: `linear-gradient(135deg, ${surface} 0%, ${D.bg} 100%)`,
          borderBottom: `2px solid ${border}`,
          padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              backgroundColor: D.bg, border: `2px solid ${border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', flexShrink: 0,
            }}>
              {team === 'red' ? '🔴' : '🔵'}
            </div>
            <div>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: '20px', fontWeight: '800', color: D.text, lineHeight: 1.1 }}>
                {team === 'red' ? 'Red Team' : 'Blue Team'}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: vivid, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '3px', opacity: 0.7 }}>
                {agentCount === 0 ? 'No agents yet' : `${agentCount} ${agentCount === 1 ? 'agent' : 'agents'}`}
              </div>
            </div>
          </div>
          {isMine && (
            <span style={{ padding: '3px 10px', backgroundColor: `${vivid}22`, border: `1px solid ${border}`, borderRadius: '20px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: vivid, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Your team
            </span>
          )}
        </div>

        {/* Roles */}
        <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: vivid, letterSpacing: '1.2px', textTransform: 'uppercase', margin: '0 0 8px', opacity: 0.55 }}>
              Spymaster
            </p>
            {spymasters.map(p => <AgentCard key={p.uuid} p={p} role="spymaster" />)}
            {!iAmSpymaster && <JoinSlot role="spymaster" />}
          </div>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: vivid, letterSpacing: '1.2px', textTransform: 'uppercase', margin: '0 0 8px', opacity: 0.55 }}>
              Operatives
            </p>
            {operatives.map(p => <AgentCard key={p.uuid} p={p} role="operative" />)}
            {!iAmOperative && <JoinSlot role="operative" />}
          </div>
        </div>
      </div>
    );
  };

  // ── Phase: connecting ─────────────────────────────────────────────────────
  if (phase === 'connecting') {
    if (notFound) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '800', color: D.text, margin: '0 0 8px' }}>
              Room not found
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: D.sub, margin: '0 0 28px', lineHeight: 1.5 }}>
              No one is hosting room <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', color: D.text }}>{code}</span>.<br />
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
      <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: D.muted, fontSize: '16px' }}>
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

    const VoteStatus = ({ voted, action, label, vivid }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: vivid, flexShrink: 0 }} />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: D.sub, fontWeight: '600' }}>{label}:</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: voted ? (action === 'veto' ? '#F87171' : '#4ADE80') : D.muted, fontStyle: voted ? 'normal' : 'italic' }}>
          {voted ? (action === 'veto' ? 'Requesting new grid' : 'Looks good ✓') : 'Deciding...'}
        </span>
      </div>
    );

    return (
      <>
        <Head><title>Codenames — Grid Veto — {code}</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', flexDirection: 'column' }}>
          <PlayerBar players={players} myUuid={myUuid} phase={phase} currentTeam={currentTeam} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontWeight: '800', color: D.text, margin: '0 0 4px' }}>
                Grid Veto
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: D.muted, margin: 0 }}>
                Both teams must approve this board before the game begins.
                {(gridRedVetoUsed || gridBlueVetoUsed) && ' (each team gets one veto)'}
              </p>
            </div>

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

            <div style={{ backgroundColor: D.surface, border: `1px solid ${D.border2}`, borderRadius: '16px', padding: '20px 24px', maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <VoteStatus voted={gridRedReady}  action={gridRedAction}  label="Red team"  vivid={TEAM_VIVID.red} />
              <VoteStatus voted={gridBlueReady} action={gridBlueAction} label="Blue team" vivid={TEAM_VIVID.blue} />

              {myTeam && !myVoted && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', paddingTop: '12px', borderTop: `1px solid ${D.border2}` }}>
                  <button
                    onClick={() => handleVoteGrid('approve')}
                    style={{ padding: '10px 22px', backgroundColor: '#166534', color: '#4ADE80', border: '1.5px solid #166534', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#14532D'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#166534'; }}
                  >
                    Looks good ✓
                  </button>
                  {!myVetoUsed && (
                    <button
                      onClick={() => handleVoteGrid('veto')}
                      style={{ padding: '10px 22px', backgroundColor: D.surface2, color: '#F87171', border: '1.5px solid #7F1D1D', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#7F1D1D'; }}
                    >
                      Request new grid ↻
                    </button>
                  )}
                </div>
              )}

              {myTeam && myVoted && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: D.muted, textAlign: 'center', margin: 0, paddingTop: '12px', borderTop: `1px solid ${D.border2}` }}>
                  {oppVoted ? 'Resolving...' : 'Waiting for the other team...'}
                </p>
              )}

              {!myTeam && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: D.muted, textAlign: 'center', margin: 0, paddingTop: '12px', borderTop: `1px solid ${D.border2}` }}>
                  You're watching — teams are voting on this grid.
                </p>
              )}

              {myTeam && !myVoted && myVetoUsed && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: D.muted, textAlign: 'center', margin: '-8px 0 0' }}>
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
        <Head><title>Codenames — {code}</title></Head>
        <style>{`
          @keyframes readyPulse {
            0%, 100% { box-shadow: 0 0 30px rgba(74,222,128,0.3), 0 0 60px rgba(74,222,128,0.1); }
            50%       { box-shadow: 0 0 50px rgba(74,222,128,0.5), 0 0 100px rgba(74,222,128,0.15); }
          }
        `}</style>
        <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ backgroundColor: D.surface, borderBottom: `1px solid ${D.border2}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => router.push('/codenames')}
              style={{ background: 'none', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: D.muted, cursor: 'pointer', padding: '6px 0' }}
            >
              ← Back
            </button>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontWeight: '800', color: D.text, margin: 0, letterSpacing: '-0.5px', lineHeight: 1 }}>
                Code<span style={{ color: '#F87171' }}>names</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: D.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>Room</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '700', color: D.sub, letterSpacing: '3px' }}>{code}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {devMode && (
                <span style={{ padding: '3px 8px', backgroundColor: '#3D2900', border: '1px solid #92400E', borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: '#FCD34D', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Dev
                </span>
              )}
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 20px', gap: '20px', maxWidth: '860px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

            {/* Team panels — strict 50/50 grid with VS divider */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'stretch', gap: '0' }}>
              <TeamColumn team="red" />

              {/* VS divider */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 18px', gap: '10px' }}>
                <div style={{ width: '1px', flex: 1, background: `linear-gradient(to bottom, transparent, ${D.border}, transparent)` }} />
                <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '13px', fontWeight: '800', color: D.muted, letterSpacing: '2px' }}>VS</span>
                <div style={{ width: '1px', flex: 1, background: `linear-gradient(to bottom, transparent, ${D.border}, transparent)` }} />
              </div>

              <TeamColumn team="blue" />
            </div>

            {/* Unassigned players */}
            {unassigned.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: D.muted, textTransform: 'uppercase', letterSpacing: '1px' }}>In lobby:</span>
                {unassigned.map(p => (
                  <span key={p.uuid} style={{ padding: '3px 10px', backgroundColor: D.surface2, border: `1px solid ${D.border}`, borderRadius: '20px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: D.sub }}>
                    {p.name}{p.uuid === myUuid ? ' (you)' : ''}
                  </span>
                ))}
              </div>
            )}

            {/* Start / waiting */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingBottom: '8px' }}>
              {isHost ? (
                <>
                  <button
                    onClick={handleStartGame}
                    disabled={!ready}
                    style={{
                      padding: '16px 72px',
                      background: ready ? 'linear-gradient(135deg, #166534, #15803D)' : D.surface2,
                      color: ready ? '#4ADE80' : D.muted,
                      border: `2px solid ${ready ? '#166534' : D.border}`,
                      borderRadius: '14px',
                      fontSize: '18px', fontWeight: '800', fontFamily: 'Nunito, sans-serif',
                      letterSpacing: '1px', textTransform: 'uppercase',
                      cursor: ready ? 'pointer' : 'not-allowed',
                      animation: ready ? 'readyPulse 2.5s ease-in-out infinite' : 'none',
                      transition: 'background 0.3s, color 0.3s, border-color 0.3s',
                    }}
                    onMouseEnter={e => { if (ready) { e.currentTarget.style.background = 'linear-gradient(135deg, #14532D, #166534)'; e.currentTarget.style.animation = 'none'; }}}
                    onMouseLeave={e => { if (ready) { e.currentTarget.style.background = 'linear-gradient(135deg, #166534, #15803D)'; e.currentTarget.style.animation = 'readyPulse 2.5s ease-in-out infinite'; }}}
                  >
                    ▶ Start Game
                  </button>
                  {!ready && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: D.muted, margin: 0 }}>
                      {devMode ? 'Each team needs at least 1 player with any role.' : 'Each team needs 1 spymaster and 1+ operative.'}
                    </p>
                  )}
                </>
              ) : (
                <div style={{ padding: '14px 28px', backgroundColor: D.surface, border: `1px solid ${D.border2}`, borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: D.muted }}>
                  Waiting for host to start the game...
                </div>
              )}
            </div>

          </div>
        </div>
        <RulesModal />
      </>
    );
  }

  // ── Phase: game (spymaster-clue | operatives-guess | spymaster-needed | over) ─
  const winnerColor = winner ? TEAM_COLORS[winner] : D.border;
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
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: D.bg }}>

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

        {phase === 'over' && winner && (
          <div style={{ backgroundColor: winnerColor, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', boxShadow: `0 4px 20px ${winnerColor}66` }}>
            <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
              {gameOverIcon} {winnerLabel} wins! — {gameOverMsg}
            </span>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: '20px' }}>

          {isSpymasterView && phase !== 'over' && (
            <div style={{ padding: '8px 18px', backgroundColor: TEAM_SURFACE[myTeam] || D.surface, border: `1.5px solid ${TEAM_BORDER[myTeam] || D.border}`, borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', color: TEAM_VIVID[myTeam] || D.sub }}>
              👁 Spymaster view — don't show your screen to your team!
            </div>
          )}

          {myTeam && !isCurrentTeam && phase === 'operatives-guess' && (
            <div style={{ padding: '8px 18px', backgroundColor: D.surface, border: `1px solid ${D.border2}`, borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: D.sub }}>
              Waiting for {currentTeam === 'red' ? '🔴 Red' : '🔵 Blue'} team...
            </div>
          )}

          {myTeam && !isCurrentTeam && phase === 'spymaster-clue' && (
            <div style={{ padding: '8px 18px', backgroundColor: D.surface, border: `1px solid ${D.border2}`, borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: D.sub }}>
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
                padding: '10px 24px',
                backgroundColor: TEAM_SURFACE[currentTeam],
                border: `1.5px solid ${TEAM_BORDER[currentTeam]}`,
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '600',
                color: TEAM_VIVID[currentTeam], cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = TEAM_VIVID[currentTeam]; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = TEAM_BORDER[currentTeam]; }}
            >
              Pass Turn
            </button>
          )}

          {!myRole && phase !== 'over' && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: D.muted }}>
              You're watching — you weren't assigned a role before the game started.
            </p>
          )}

          {phase === 'over' && (
            <div style={{ backgroundColor: D.surface, border: `1px solid ${D.border2}`, borderRadius: '16px', padding: '20px 24px', maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: D.muted, margin: '0 0 10px' }}>
                  Rematch — need 2 from each team
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleVoteRematch}
                    disabled={myRematchVote}
                    style={{ padding: '8px 18px', backgroundColor: myRematchVote ? '#166534' : D.surface2, color: myRematchVote ? '#4ADE80' : D.sub, border: `1.5px solid ${myRematchVote ? '#166534' : D.border}`, borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '700', cursor: myRematchVote ? 'default' : 'pointer' }}
                  >
                    {myRematchVote ? 'Voted ✓' : 'Vote Rematch'}
                  </button>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: D.sub }}>
                    🔴 {redVoteCount}/2 &nbsp; 🔵 {blueVoteCount}/2
                  </span>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${D.border2}`, paddingTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {isHost && (
                  <button
                    onClick={handleRequeue}
                    style={{ padding: '9px 20px', backgroundColor: D.surface2, color: D.sub, border: `1.5px solid ${D.border}`, borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = D.sub; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; }}
                  >
                    ← Back to Lobby
                  </button>
                )}
                <button
                  onClick={() => { localStorage.removeItem('poordown_active_room'); router.push('/codenames'); }}
                  style={{ padding: '9px 20px', backgroundColor: D.surface2, color: '#F87171', border: '1.5px solid #7F1D1D', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#7F1D1D'; }}
                >
                  Leave Room
                </button>
              </div>
            </div>
          )}

          {phase !== 'over' && <LeaveButton />}
        </div>

        {selectedCard !== null && isOperativeTurn && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#1A1040', borderTop: '2px solid #7C3AED', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 50, boxShadow: '0 -6px 24px rgba(124,58,237,0.3)' }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: D.sub }}>
              Guess <strong style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '1px', color: '#C4B5FD' }}>{words[selectedCard]}</strong>?
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
              style={{ padding: '9px 16px', backgroundColor: 'transparent', color: D.muted, border: `1.5px solid ${D.border}`, borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
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
