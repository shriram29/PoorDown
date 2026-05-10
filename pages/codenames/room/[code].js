import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import Board from '../../../components/games/codenames/board/Board';
import GameHUD from '../../../components/games/codenames/hud/GameHUD';
import ClueInput from '../../../components/games/codenames/hud/ClueInput';
import { startGame, submitClue, revealCard, endTurn } from '../../../lib/games/codenames/state';

const TEAM_COLORS = { red: '#DC2626', blue: '#2563EB' };
const TEAM_BG     = { red: '#FEE2E2', blue: '#DBEAFE' };
const TEAM_LIGHT  = { red: '#FFF5F5', blue: '#EFF6FF' };

export default function CodenamesRoom() {
  const router = useRouter();
  const { code } = router.query;

  const [myUuid, setMyUuid]       = useState(null);
  const [isHost, setIsHost]       = useState(false);
  const [players, setPlayers]     = useState([]);
  const [gameState, setGameState] = useState({
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
  });
  const [lastReveal, setLastReveal] = useState(null); // { index, type } for flash

  const metaRef     = useRef(null);
  const yPlayersRef = useRef(null);
  const yRevealedRef = useRef(null);

  useEffect(() => {
    if (!code || typeof window === 'undefined') return;

    const stored = localStorage.getItem('poordown_identity');
    const identity = stored ? JSON.parse(stored) : null;
    if (!identity) {
      router.push('/');
      return;
    }
    setMyUuid(identity.uuid);

    const hostFlag = new URLSearchParams(window.location.search).get('host') === 'true';
    setIsHost(hostFlag);

    const doc      = new Y.Doc();
    const provider = new WebrtcProvider(`poordown-codenames-${code}`, doc);
    const meta     = doc.getMap('meta');
    const yPlayers = doc.getArray('players');
    const yRevealed = doc.getMap('revealed');

    metaRef.current     = meta;
    yPlayersRef.current = yPlayers;
    yRevealedRef.current = yRevealed;

    const syncState = () => {
      const wordsRaw   = meta.get('words');
      const keyRaw     = meta.get('keyCard');
      const phase      = meta.get('phase');
      setGameState({
        phase:          phase || (hostFlag ? 'lobby' : 'connecting'),
        currentTeam:    meta.get('currentTeam') || null,
        firstTeam:      meta.get('firstTeam')   || null,
        clueWord:       meta.get('clueWord')     || '',
        clueNumber:     meta.get('clueNumber')   ?? 0,
        guessesLeft:    meta.get('guessesLeft')  ?? 0,
        winner:         meta.get('winner')       || null,
        winReason:      meta.get('winReason')    || null,
        words:          wordsRaw ? JSON.parse(wordsRaw) : [],
        keyCard:        keyRaw   ? JSON.parse(keyRaw)   : [],
        revealed:       Array.from({ length: 25 }, (_, i) => yRevealed.get(String(i)) || false),
        redRemaining:   meta.get('redRemaining') ?? 0,
        blueRemaining:  meta.get('blueRemaining') ?? 0,
      });
    };

    const syncPlayers = () => setPlayers(yPlayers.toArray());

    meta.observe(syncState);
    yRevealed.observe(syncState);
    yPlayers.observe(syncPlayers);

    const timer = setTimeout(() => {
      if (hostFlag && !meta.get('phase')) {
        meta.set('phase', 'lobby');
      }
      const existing = yPlayers.toArray().find(p => p.uuid === identity.uuid);
      if (!existing) {
        yPlayers.push([{
          uuid:     identity.uuid,
          name:     identity.name,
          team:     null,
          role:     null,
          joinedAt: Date.now(),
        }]);
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

  // ── Derived ──────────────────────────────────────────────────────────────
  const myPlayer = players.find(p => p.uuid === myUuid);
  const myTeam   = myPlayer?.team || null;
  const myRole   = myPlayer?.role || null;

  const { phase, currentTeam, words, keyCard, revealed, clueWord, clueNumber,
          guessesLeft, winner, winReason, redRemaining, blueRemaining } = gameState;

  const isCurrentTeam    = myTeam === currentTeam;
  const isSpymasterTurn  = phase === 'spymaster-clue'   && isCurrentTeam && myRole === 'spymaster';
  const isOperativeTurn  = phase === 'operatives-guess' && isCurrentTeam && myRole === 'operative';
  const isSpymasterView  = myRole === 'spymaster';

  const canStart = () => {
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

  const handleStartGame = () => startGame(metaRef.current, yRevealedRef.current);

  const handleSubmitClue = (word, number) => submitClue(metaRef.current, word, number);

  const handleCardClick = (index) => {
    if (!isOperativeTurn || revealed[index]) return;
    const result = revealCard(metaRef.current, yRevealedRef.current, index);
    setLastReveal({ index, type: result.cardType });
    setTimeout(() => setLastReveal(null), 1500);
  };

  const handlePass = () => endTurn(metaRef.current);

  const handlePlayAgain = () => startGame(metaRef.current, yRevealedRef.current);

  // ── Render helpers ────────────────────────────────────────────────────────
  const TeamColumn = ({ team }) => {
    const spymasters = players.filter(p => p.team === team && p.role === 'spymaster');
    const operatives = players.filter(p => p.team === team && p.role === 'operative');
    const color      = TEAM_COLORS[team];
    const bg         = TEAM_BG[team];
    const label      = team === 'red' ? 'Red Team' : 'Blue Team';

    const iAmSpymaster = myTeam === team && myRole === 'spymaster';
    const iAmOperative = myTeam === team && myRole === 'operative';

    return (
      <div
        style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          border: myTeam === team ? `2px solid ${color}` : '2px solid transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '18px', fontWeight: '800', color: '#2B2D42' }}>
            {label}
          </span>
        </div>

        {/* Spymaster slot */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
            Spymaster
          </p>
          {spymasters.length > 0 ? (
            spymasters.map(p => (
              <div key={p.uuid} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: p.uuid === myUuid ? '700' : '400', color: '#2B2D42' }}>
                  {p.name}{p.uuid === myUuid ? ' (you)' : ''}
                </span>
              </div>
            ))
          ) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#C8C4B8', fontStyle: 'italic' }}>
              No spymaster yet
            </span>
          )}
          {!iAmSpymaster && (
            <button
              onClick={() => assignSelf(team, 'spymaster')}
              style={{
                marginTop: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: `1.5px solid ${color}`,
                backgroundColor: 'white',
                color,
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = bg; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
            >
              Join as Spymaster
            </button>
          )}
        </div>

        {/* Operative slots */}
        <div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
            Operatives
          </p>
          {operatives.length > 0 ? (
            operatives.map(p => (
              <div key={p.uuid} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: p.uuid === myUuid ? '700' : '400', color: '#2B2D42' }}>
                  {p.name}{p.uuid === myUuid ? ' (you)' : ''}
                </span>
              </div>
            ))
          ) : (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#C8C4B8', fontStyle: 'italic' }}>
              No operatives yet
            </span>
          )}
          {!iAmOperative && (
            <button
              onClick={() => assignSelf(team, 'operative')}
              style={{
                marginTop: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: `1.5px solid ${color}`,
                backgroundColor: 'white',
                color,
                fontSize: '12px',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = bg; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
            >
              Join as Operative
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Phase: connecting ─────────────────────────────────────────────────────
  if (phase === 'connecting') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F4E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', color: '#8D99AE', fontSize: '16px' }}>
          Connecting to room {code}...
        </p>
      </div>
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
          {/* Header */}
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
            </div>
            <div style={{ width: '48px' }} />
          </div>

          {/* Team columns */}
          <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <TeamColumn team="red" />
            <TeamColumn team="blue" />
          </div>

          {/* Unassigned */}
          {unassigned.length > 0 && (
            <div style={{ maxWidth: '760px', margin: '20px auto 0', padding: '16px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '700', color: '#8D99AE', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                Not yet assigned
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {unassigned.map(p => (
                  <span key={p.uuid} style={{ padding: '4px 12px', backgroundColor: '#F5F0E8', borderRadius: '20px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2B2D42' }}>
                    {p.name}{p.uuid === myUuid ? ' (you)' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Start game */}
          {isHost && (
            <div style={{ maxWidth: '760px', margin: '24px auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleStartGame}
                disabled={!ready}
                style={{
                  padding: '14px 40px',
                  backgroundColor: ready ? '#2D6A4F' : '#8D99AE',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  fontFamily: 'Inter, sans-serif',
                  cursor: ready ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => { if (ready) e.currentTarget.style.backgroundColor = '#245A42'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ready ? '#2D6A4F' : '#8D99AE'; }}
              >
                Start Game
              </button>
              {!ready && (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8D99AE', margin: 0 }}>
                  Each team needs at least 1 spymaster and 1 operative.
                </p>
              )}
            </div>
          )}
          {!isHost && (
            <p style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', marginTop: '24px' }}>
              Waiting for host to start the game...
            </p>
          )}
        </div>
      </>
    );
  }

  // ── Phase: game ───────────────────────────────────────────────────────────
  const winnerColor = winner ? TEAM_COLORS[winner] : '#2B2D42';
  const winnerLabel = winner === 'red' ? 'Red Team' : 'Blue Team';

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

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 16px',
            gap: '20px',
          }}
        >
          {/* Spymaster warning banner */}
          {isSpymasterView && phase !== 'over' && (
            <div
              style={{
                padding: '8px 18px',
                backgroundColor: TEAM_LIGHT[myTeam] || '#F5F0E8',
                border: `1.5px solid ${TEAM_COLORS[myTeam] || '#8D99AE'}`,
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: '600',
                color: TEAM_COLORS[myTeam] || '#2B2D42',
              }}
            >
              👁 Spymaster view — don't show your screen to your team!
            </div>
          )}

          {/* Waiting message for non-active team */}
          {myTeam && !isCurrentTeam && phase !== 'over' && (
            <div
              style={{
                padding: '8px 18px',
                backgroundColor: 'white',
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#8D99AE',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              Waiting for {currentTeam === 'red' ? '🔴 Red' : '🔵 Blue'} team...
            </div>
          )}

          <Board
            words={words}
            keyCard={keyCard}
            revealed={revealed}
            isSpymaster={isSpymasterView}
            isClickable={isOperativeTurn}
            onCardClick={handleCardClick}
          />

          {/* Clue input — active spymaster only */}
          {isSpymasterTurn && (
            <ClueInput currentTeam={currentTeam} onSubmit={handleSubmitClue} />
          )}

          {/* Pass button — active operatives only */}
          {isOperativeTurn && (
            <button
              onClick={handlePass}
              style={{
                padding: '10px 24px',
                backgroundColor: 'white',
                border: `2px solid ${TEAM_COLORS[currentTeam]}`,
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: '600',
                color: TEAM_COLORS[currentTeam],
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = TEAM_BG[currentTeam]; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
            >
              Pass Turn
            </button>
          )}

          {/* Spectator / no role */}
          {!myRole && phase !== 'over' && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE' }}>
              You're watching — you weren't assigned a role before the game started.
            </p>
          )}
        </div>

        {/* Game Over overlay */}
        {phase === 'over' && winner && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '48px 40px',
                textAlign: 'center',
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
              }}
            >
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>
                {winReason === 'assassin' ? '💀' : '🎉'}
              </div>
              <h2
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '36px',
                  fontWeight: '800',
                  color: winnerColor,
                  margin: '0 0 10px 0',
                }}
              >
                {winnerLabel} wins!
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  color: '#8D99AE',
                  margin: '0 0 32px 0',
                  lineHeight: 1.5,
                }}
              >
                {winReason === 'assassin'
                  ? 'The assassin was revealed — instant loss.'
                  : 'All agents found first!'}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {isHost && (
                  <button
                    onClick={handlePlayAgain}
                    style={{
                      padding: '12px 28px',
                      backgroundColor: '#2D6A4F',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '700',
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#245A42'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2D6A4F'; }}
                  >
                    Play Again
                  </button>
                )}
                <button
                  onClick={() => router.push('/codenames')}
                  style={{
                    padding: '12px 28px',
                    backgroundColor: 'white',
                    color: '#2B2D42',
                    border: '2px solid #E8E4D8',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  Leave Room
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
