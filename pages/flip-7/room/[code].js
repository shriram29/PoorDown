import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { startRound, endRound, calcRoundScore } from '../../../lib/games/flip-7/state';
import { shuffleCards } from '../../../lib/games/flip-7/deck';

const GAME_COLOR = '#FF6B35';
const GAME_GLOW = 'rgba(255,107,53,0.4)';

// Board game felt palette
const BG = '#091810';
const SURFACE = '#0d2418';
const PANEL = '#122d1c';
const PANEL_DARK = '#081610';
const PANEL_BORDER = 'rgba(38,95,58,0.5)';
const TEXT = '#e8dfc8';
const TEXT_DIM = '#5a9068';
const GOLD = '#c8983a';

// 8 maximally distinct, vivid hues — easy to tell apart at a glance
const PLAYER_COLORS = [
  '#FF3B30', // red
  '#0A84FF', // blue
  '#30D158', // green
  '#FFD60A', // yellow
  '#BF5AF2', // purple
  '#32D2D0', // cyan
  '#FF9F0A', // amber
  '#FF375F', // rose
];

// ── Card visuals ──────────────────────────────────────────────────────────────

function NumberCard({ value, animate }) {
  return (
    <div style={{
      width: 38, height: 53, borderRadius: 7,
      backgroundColor: '#f2e8cc',
      border: `2px solid ${GAME_COLOR}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: 18, color: '#1a2e20',
      boxShadow: '0 3px 8px rgba(0,0,0,0.6)', flexShrink: 0,
      animation: animate ? 'cardAppear 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
    }}>
      {value}
    </div>
  );
}

function ModifierCard({ value, animate }) {
  const isX2 = value === 'x2';
  const color = isX2 ? '#c8980a' : '#0a8070';
  const bgColor = isX2 ? '#fff8e0' : '#e0f8f4';
  return (
    <div style={{
      width: 38, height: 53, borderRadius: 7,
      backgroundColor: bgColor,
      border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'JetBrains Mono, monospace', fontWeight: '800', fontSize: 11, color,
      flexShrink: 0,
      boxShadow: '0 3px 8px rgba(0,0,0,0.6)',
      animation: animate ? 'cardAppear 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
    }}>
      {value}
    </div>
  );
}

function ActionCard({ value, animate, large }) {
  const cfg = {
    freeze:          { color: '#1a6fa8', bg: '#e0f0fc', icon: '❄️', label: 'Freeze' },
    'flip-three':    { color: '#a84a10', bg: '#fdf0e8', icon: '✕3', label: 'Flip 3' },
    'second-chance': { color: '#6a3aa8', bg: '#f0ecfc', icon: '♻',  label: '2nd Ch.' },
  }[value] || { color: '#444', bg: '#f0f0f0', icon: '?', label: value };
  const w = large ? 58 : 38;
  const h = large ? 81 : 53;
  return (
    <div style={{
      width: w, height: h, borderRadius: 7,
      backgroundColor: cfg.bg,
      border: `2px solid ${cfg.color}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 2, flexShrink: 0,
      boxShadow: '0 3px 8px rgba(0,0,0,0.6)',
      animation: animate ? 'cardAppear 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
    }}>
      <span style={{ fontSize: large ? 22 : 14 }}>{cfg.icon}</span>
      <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700', fontSize: large ? 10 : 8, color: cfg.color, letterSpacing: '0.3px' }}>{cfg.label}</span>
    </div>
  );
}

function CardBack({ large }) {
  const w = large ? 72 : 38;
  const h = large ? 101 : 53;
  return (
    <div style={{
      width: w, height: h, borderRadius: 7,
      backgroundColor: '#0d3520',
      border: `2px solid ${GAME_COLOR}55`,
      backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,107,53,0.07) 0px, rgba(255,107,53,0.07) 2px, transparent 2px, transparent 10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: '0 3px 8px rgba(0,0,0,0.6)',
    }}>
      <img src="/assets/flip7.svg" alt="" style={{ width: large ? 28 : 16, opacity: 0.55 }} />
    </div>
  );
}

// ── Deck pile visual ──────────────────────────────────────────────────────────

function DeckPile({ count, isActive, onHit, animKey }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <button
        onClick={isActive ? onHit : undefined}
        disabled={!isActive || count === 0}
        style={{
          background: 'none', border: 'none', cursor: isActive && count > 0 ? 'pointer' : 'default',
          padding: 0, position: 'relative', width: 80, height: 112,
        }}
        title={isActive ? 'Click to Hit' : undefined}
      >
        {/* Stack layers */}
        {count > 2 && (
          <div style={{ position: 'absolute', inset: 0, top: 5, left: 5, width: 70, height: 101, borderRadius: 7, backgroundColor: '#082010', border: `1px solid ${GAME_COLOR}18` }} />
        )}
        {count > 1 && (
          <div style={{ position: 'absolute', inset: 0, top: 2.5, left: 2.5, width: 70, height: 101, borderRadius: 7, backgroundColor: '#0a2a16', border: `1px solid ${GAME_COLOR}28` }} />
        )}
        {/* Top card */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: 70, height: 101, borderRadius: 7,
          backgroundColor: '#0d3520',
          border: `2px solid ${isActive ? GAME_COLOR : GAME_COLOR + '44'}`,
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,107,53,0.07) 0px, rgba(255,107,53,0.07) 2px, transparent 2px, transparent 10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isActive ? `0 0 28px ${GAME_GLOW}` : '0 6px 20px rgba(0,0,0,0.7)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          animation: isActive ? 'deckPulse 2.5s ease-in-out infinite' : 'none',
        }}>
          <img src="/assets/flip7.svg" alt="" style={{ width: 28, opacity: 0.65 }} />
        </div>
        {/* Count badge */}
        <div style={{
          position: 'absolute', bottom: -4, right: -6,
          backgroundColor: GAME_COLOR, color: '#fff',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: '700',
          padding: '2px 7px', borderRadius: 10, border: `2px solid ${BG}`,
        }}>
          {count}
        </div>
      </button>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: isActive ? GAME_COLOR : TEXT_DIM, fontWeight: isActive ? '700' : '400', letterSpacing: '0.3px' }}>
        {isActive ? '↑ HIT' : 'DECK'}
      </span>
    </div>
  );
}

// ── Last drawn card display ───────────────────────────────────────────────────

function LastDrawnCard({ card, animKey }) {
  if (!card) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 72, height: 101, borderRadius: 7, border: `2px dashed ${PANEL_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: TEXT_DIM + '66' }}>—</span>
      </div>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: TEXT_DIM }}>Last card</span>
    </div>
  );

  const elem = card.type === 'number'
    ? <NumberCard value={card.value} animate />
    : card.type === 'modifier'
    ? <ModifierCard value={card.value} animate />
    : <ActionCard value={card.value} animate large />;

  const label = card.type === 'number'
    ? (card.value === 0 ? 'Zero' : `Number ${card.value}`)
    : card.type === 'modifier'
    ? (card.value === 'x2' ? 'Double!' : `${card.value} bonus`)
    : { freeze: 'Freeze!', 'flip-three': 'Flip Three!', 'second-chance': 'Second Chance!' }[card.value];

  return (
    <div key={animKey} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'cardAppear 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <div style={{ width: 72, height: 101, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {elem}
      </div>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: TEXT_DIM, textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

// ── Bust card (the duplicate that ended the player's round) ──────────────────

function BustCard({ value }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: 38, height: 53, borderRadius: 7,
        backgroundColor: '#ff4d5618',
        border: '2px solid #ff4d56',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 16, color: '#ff4d56',
      }}>
        {value}
      </div>
      {/* × badge */}
      <div style={{
        position: 'absolute', top: -6, right: -6,
        width: 16, height: 16, borderRadius: '50%',
        backgroundColor: '#ff4d56', border: `2px solid ${BG}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: '#fff', fontWeight: '900', lineHeight: 1,
      }}>×</div>
    </div>
  );
}

// ── Player table ──────────────────────────────────────────────────────────────

function PlayerTable({ player, isActive, isMe, color, roundScore, isCurrentRound }) {
  const done = player.busted || player.stayed;
  const borderColor = player.busted ? '#ff4d5666' : player.stayed ? '#2a9a7066' : isActive ? color : PANEL_BORDER;

  return (
    <div style={{
      width: 190, flexShrink: 0,
      backgroundColor: isActive ? PANEL : SURFACE,
      border: `2px solid ${borderColor}`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 14, padding: '12px 14px',
      boxShadow: isActive ? `0 0 24px ${color}50, 0 8px 24px rgba(0,0,0,0.5)` : '0 4px 12px rgba(0,0,0,0.4)',
      transition: 'border-color 0.25s, box-shadow 0.25s',
      opacity: player.busted ? 0.65 : 1,
    }}>
      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 13, color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.name}{isMe ? ' ✦' : ''}
        </span>
        {player.busted && <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: '800', fontSize: 10, color: '#ff4d56', letterSpacing: '0.5px' }}>BUST</span>}
        {player.stayed && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: 11, color: GOLD }}>{roundScore}</span>}
        {player.frozen && !done && <span style={{ fontSize: 12 }}>❄️</span>}
      </div>

      {/* Modifier cards */}
      {player.modifierCards.length > 0 && (
        <div style={{ display: 'flex', gap: 3, marginBottom: 5, flexWrap: 'wrap' }}>
          {player.modifierCards.map((m, i) => <ModifierCard key={i} value={m} />)}
        </div>
      )}

      {/* Number cards + bust card */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', minHeight: 54, alignItems: 'flex-start' }}>
        {player.numberCards.length === 0 && !player.bustCard
          ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: TEXT_DIM + '55', alignSelf: 'center' }}>—</span>
          : <>
              {player.numberCards.map((n, i) => <NumberCard key={i} value={n} />)}
              {player.busted && player.bustCard !== null && player.bustCard !== undefined && (
                <>
                  <div style={{ width: 1, height: 48, backgroundColor: '#ff4d5444', borderRadius: 1, alignSelf: 'center', flexShrink: 0, marginLeft: 1 }} />
                  <BustCard value={player.bustCard} />
                </>
              )}
            </>
        }
      </div>

      {/* Second Chance + score preview */}
      <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        {player.hasSecondChance
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: '#6a3aa818', border: '1px solid #6a3aa844', borderRadius: 5, padding: '2px 6px' }}>
              <span style={{ fontSize: 10 }}>♻</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#a07ad8', fontWeight: '600' }}>2nd Chance</span>
            </div>
          : <span />
        }
        {!done && isCurrentRound && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: TEXT_DIM }}>
            ~{roundScore}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Scoreboard sidebar ────────────────────────────────────────────────────────

function Scoreboard({ players, cumulativeScores, myUuid, playerColors, roundNum }) {
  return (
    <div style={{
      width: 200, flexShrink: 0,
      backgroundColor: PANEL_DARK,
      borderRight: `1px solid ${PANEL_BORDER}`,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
      padding: '16px 0',
    }}>
      {/* Round scores */}
      <div style={{ padding: '0 16px 12px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: '700', color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 10px 0' }}>
          Round {roundNum}
        </p>
        {players.map((p, i) => {
          const rs = calcRoundScore(p);
          return (
            <div key={p.uuid} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: playerColors[i % playerColors.length], flexShrink: 0 }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: p.uuid === myUuid ? TEXT : TEXT_DIM, fontWeight: p.uuid === myUuid ? '700' : '400', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
              </div>
              <div style={{ paddingLeft: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: '700', color: p.busted ? '#ff4d5688' : p.stayed ? GOLD : TEXT }}>
                  {p.busted ? '0' : p.stayed ? rs : `~${rs}`}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: p.busted ? '#ff4d5688' : p.stayed ? GOLD + '99' : p.frozen ? '#60a5fa88' : TEXT_DIM + '88', letterSpacing: '0.4px' }}>
                  {p.busted ? 'bust' : p.stayed ? 'done' : p.frozen ? 'frozen' : 'in'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: PANEL_BORDER, margin: '4px 16px 12px' }} />

      {/* Total scores */}
      <div style={{ padding: '0 16px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: '700', color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 10px 0' }}>
          Total
        </p>
        {Object.entries(cumulativeScores)
          .sort(([, a], [, b]) => b - a)
          .map(([uuid, score]) => {
            const p = players.find(pl => pl.uuid === uuid);
            const pi = players.findIndex(pl => pl.uuid === uuid);
            const pct = Math.min(score / 200, 1);
            return (
              <div key={uuid} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: uuid === myUuid ? TEXT : TEXT_DIM, fontWeight: uuid === myUuid ? '700' : '400' }}>
                    {p?.name || '?'}
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: '700', color: score >= 150 ? GOLD : TEXT }}>
                    {score}
                  </span>
                </div>
                <div style={{ height: 4, backgroundColor: SURFACE, borderRadius: 2 }}>
                  <div style={{ height: 4, backgroundColor: playerColors[pi >= 0 ? pi % playerColors.length : 0], borderRadius: 2, width: `${pct * 100}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        {Object.keys(cumulativeScores).length === 0 && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: TEXT_DIM + '66', margin: 0 }}>No scores yet</p>
        )}
      </div>
    </div>
  );
}

// ── Rules panel ───────────────────────────────────────────────────────────────

const RULES_SECTIONS = [
  {
    title: 'Goal',
    body: 'Be the first player to reach 200 cumulative points across multiple rounds.',
  },
  {
    title: 'The Deck (94 cards)',
    body: '79 Number cards (one 0, then 1–12 where count = value) · 6 Modifier cards (+2 +4 +6 +8 +10 ×2) · 9 Action cards (3× Freeze, 3× Flip Three, 3× Second Chance). The deck is never reset between rounds — it keeps depleting. When the last card is drawn, a fresh shuffled deck continues seamlessly.',
  },
  {
    title: 'Starting a Round',
    body: 'Every round, all players start with no cards. The first player to draw is the one after whoever ended the previous round — turn order rotates each round.',
  },
  {
    title: 'Your Turn',
    body: 'Choose HIT to draw one card, or STAY to lock in your score. After you hit, the turn passes to the next player. On your next turn you can hit or stay again — unless you busted.',
  },
  {
    title: 'Busting',
    body: 'If you draw a number you already have in front of you — you BUST. Discard all your cards and score 0 this round.',
  },
  {
    title: 'Modifier Cards',
    body: '+2 / +4 / +6 / +8 / +10 are added after doubling. ×2 doubles your entire number card total before flat modifiers are added. Modifiers never cause a bust.',
  },
  {
    title: 'Freeze ❄️',
    body: 'The drawer picks any active player. That player is skipped on their next turn. A frozen player can still receive cards from Flip Three.',
  },
  {
    title: 'Flip Three ✕3',
    body: 'The drawer immediately deals 3 cards (one at a time) to any active players they choose. Each card resolves normally: number → bust check, modifier → placed, action → resolved.',
  },
  {
    title: 'Second Chance ♻',
    body: 'The drawer keeps this card. When they would bust (draw a duplicate number), they may discard Second Chance instead — surviving the bust. Only one per player; extras go to another active player.',
  },
  {
    title: 'Scoring',
    body: '1. Sum all number cards · 2. If you have ×2, double that sum · 3. Add flat modifiers · 4. If you collected exactly 7 number cards: +15 bonus (Flip 7!).',
  },
  {
    title: 'Winning',
    body: 'First to 200 total points wins. If multiple players cross 200 in the same round, highest score wins. Exact tie → play another round.',
  },
];

function RulesPanel({ open, onClose }) {
  return (
    <div style={{
      position: 'fixed', bottom: 64, right: 20, zIndex: 300,
      width: 340, maxHeight: open ? '70vh' : 0,
      overflow: 'hidden',
      transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
      opacity: open ? 1 : 0,
      pointerEvents: open ? 'auto' : 'none',
    }}>
      <div style={{
        backgroundColor: PANEL,
        border: `1px solid ${GAME_COLOR}55`,
        borderRadius: '16px 16px 4px 16px',
        boxShadow: `0 -8px 40px rgba(0,0,0,0.7)`,
        maxHeight: '70vh', overflowY: 'auto',
        scrollbarWidth: 'thin',
      }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, backgroundColor: PANEL, padding: '16px 18px 12px', borderBottom: `1px solid ${PANEL_BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 16, color: TEXT }}>
            📖 How to Play
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px' }}
            onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={e => (e.currentTarget.style.color = TEXT_DIM)}
          >×</button>
        </div>

        {/* Rules content */}
        <div style={{ padding: '14px 18px 20px' }}>
          {RULES_SECTIONS.map((sec, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: '700', fontSize: 12, color: GAME_COLOR, margin: '0 0 4px 0', letterSpacing: '0.3px' }}>
                {sec.title}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: TEXT_DIM, margin: 0, lineHeight: 1.65 }}>
                {sec.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Flip Three assigner ───────────────────────────────────────────────────────

function FlipThreeAssigner({ cards, targets, onAssign }) {
  const [sel, setSel] = useState(null);
  return (
    <div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#8c80fc', textAlign: 'center', margin: '0 0 10px 0' }}>
        {sel === null ? 'Select a card to assign' : 'Now pick a player to give it to'}
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        {cards.map((card, i) => (
          <button key={i} onClick={() => setSel(i === sel ? null : i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 8, outline: sel === i ? `2px solid ${GAME_COLOR}` : '2px solid transparent', transform: sel === i ? 'translateY(-5px)' : 'none', transition: 'transform 0.15s, outline 0.15s' }}>
            {card.type === 'number' && <NumberCard value={card.value} />}
            {card.type === 'modifier' && <ModifierCard value={card.value} />}
            {card.type === 'action' && <ActionCard value={card.value} />}
          </button>
        ))}
      </div>
      {sel !== null && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {targets.map(t => (
            <button key={t.uuid} onClick={() => { onAssign(t.uuid, sel); setSel(null); }}
              style={{ padding: '7px 14px', backgroundColor: '#16162a', border: `2px solid ${GAME_COLOR}44`, borderRadius: 8, fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: '600', color: '#fff', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = GAME_COLOR)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = `${GAME_COLOR}44`)}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Flip7Room() {
  const router = useRouter();
  const { code } = router.query;

  const [myUuid, setMyUuid] = useState(null);
  const [peers, setPeers] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const [lastDrawnCard, setLastDrawnCard] = useState(null);
  const [drawAnimKey, setDrawAnimKey] = useState(0);
  const [gameState, setGameState] = useState({
    phase: 'connecting', players: [], deck: [],
    currentPlayerIdx: 0, pendingAction: null,
    cumulativeScores: {}, winner: null, roundNum: 0, hostId: null,
  });

  const metaRef = useRef(null);
  const yLobbyRef = useRef(null);
  // Prevents double-add in React StrictMode dev double-mount
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
    const provider = new WebrtcProvider(`poordown-flip-7-${code}`, doc, {
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

    // Add self to lobby only once (guarded against StrictMode double-mount)
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
        currentPlayerIdx: meta.get('currentPlayerIdx') ?? 0,
        pendingAction: meta.get('pendingAction') ? JSON.parse(meta.get('pendingAction')) : null,
        cumulativeScores: JSON.parse(meta.get('cumulativeScores') || '{}'),
        winner: meta.get('winner') || null,
        roundNum: meta.get('roundNum') ?? 0,
        hostId: meta.get('hostId') || null,
      });
    };

    // Deduplicate by UUID before setting lobby state
    const syncLobby = () => {
      const all = yLobby.toArray();
      const seen = new Set();
      setLobbyPlayers(all.filter(p => {
        if (seen.has(p.uuid)) return false;
        seen.add(p.uuid);
        return true;
      }));
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

  // Reset last drawn card when the active player changes
  useEffect(() => {
    setLastDrawnCard(null);
  }, [gameState.currentPlayerIdx]);

  // ── Game logic ───────────────────────────────────────────────────────────────

  const advanceTurn = useCallback((meta, players) => {
    const n = players.length;
    const currentIdx = meta.get('currentPlayerIdx') ?? 0;
    const ps = players.map(p => ({ ...p }));
    let modified = false;

    for (let step = 1; step <= n; step++) {
      const idx = (currentIdx + step) % n;
      const p = ps[idx];
      if (p.busted || p.stayed) continue;
      if (p.frozen) {
        ps[idx] = { ...p, frozen: false };
        modified = true;
        continue;
      }
      if (modified) meta.set('players', JSON.stringify(ps));
      meta.set('currentPlayerIdx', idx);
      return;
    }

    if (modified) meta.set('players', JSON.stringify(ps));
    endRound(meta, ps, JSON.parse(meta.get('cumulativeScores') || '{}'));
  }, []);

  const applyCard = useCallback((player, card, allPlayers, playerIdx) => {
    const p = { ...player };
    let extras = {};

    if (card.type === 'number') {
      if (p.numberCards.includes(card.value)) {
        if (p.hasSecondChance) { p.hasSecondChance = false; }
        else { p.busted = true; p.bustCard = card.value; }
      } else {
        p.numberCards = [...p.numberCards, card.value].sort((a, b) => a - b);
      }
    } else if (card.type === 'modifier') {
      p.modifierCards = [...p.modifierCards, card.value];
    } else if (card.type === 'action') {
      if (card.value === 'second-chance') {
        if (!p.hasSecondChance) { p.hasSecondChance = true; }
        else {
          const i = allPlayers.findIndex((op, j) => j !== playerIdx && !op.busted && !op.stayed && !op.hasSecondChance);
          if (i !== -1) extras.giveSecondChanceTo = i;
        }
      } else if (card.value === 'freeze') {
        const others = allPlayers.filter((op, j) => j !== playerIdx && !op.busted && !op.stayed);
        if (others.length > 0) extras.needsFreezeTarget = true;
      } else if (card.value === 'flip-three') {
        extras.needsFlipThree = true;
      }
    }

    return { player: p, extras };
  }, []);

  // One hit = one card drawn, then turn advances (turn-based)
  const handleHit = useCallback(() => {
    const meta = metaRef.current;
    if (!meta) return;

    let players = JSON.parse(meta.get('players') || '[]');
    let deck = JSON.parse(meta.get('deck') || '[]');
    let discardPile = JSON.parse(meta.get('discardPile') || '[]');
    const currentIdx = meta.get('currentPlayerIdx') ?? 0;
    if (players[currentIdx]?.busted || players[currentIdx]?.stayed) return;

    if (deck.length === 0) {
      deck = shuffleCards(discardPile);
      discardPile = [];
    }

    const card = deck[0];
    let newDeck = deck.slice(1);
    const { player: updated, extras } = applyCard(players[currentIdx], card, players, currentIdx);
    let newPlayers = players.map((p, i) => i === currentIdx ? updated : p);

    if (extras.giveSecondChanceTo !== undefined) {
      newPlayers[extras.giveSecondChanceTo] = { ...newPlayers[extras.giveSecondChanceTo], hasSecondChance: true };
    }

    // Action cards are resolved immediately and go to discard; number/modifier stay with player
    if (card.type === 'action') discardPile.push(card);

    setLastDrawnCard(card);
    setDrawAnimKey(k => k + 1);

    meta.set('deck', JSON.stringify(newDeck));
    meta.set('discardPile', JSON.stringify(discardPile));
    meta.set('players', JSON.stringify(newPlayers));

    if (updated.busted) {
      const allDone = newPlayers.every(p => p.busted || p.stayed);
      if (allDone) endRound(meta, newPlayers, JSON.parse(meta.get('cumulativeScores') || '{}'));
      else advanceTurn(meta, newPlayers);
      return;
    }

    if (extras.needsFreezeTarget) {
      meta.set('pendingAction', JSON.stringify({ type: 'freeze', drawerIdx: currentIdx }));
      return; // turn advances after freeze is resolved
    }

    if (extras.needsFlipThree) {
      if (newDeck.length < 3) {
        newDeck = [...newDeck, ...shuffleCards(discardPile)];
        discardPile = [];
        meta.set('discardPile', JSON.stringify(discardPile));
      }
      const ftCards = newDeck.slice(0, 3);
      newDeck = newDeck.slice(3);
      meta.set('deck', JSON.stringify(newDeck));
      meta.set('pendingAction', JSON.stringify({ type: 'flip-three', drawerIdx: currentIdx, cards: ftCards, assignedCount: 0 }));
      return; // turn advances after all 3 cards are assigned
    }

    // Normal card (number, modifier, or second-chance) → advance turn
    const allDone = newPlayers.every(p => p.busted || p.stayed);
    if (allDone) endRound(meta, newPlayers, JSON.parse(meta.get('cumulativeScores') || '{}'));
    else advanceTurn(meta, newPlayers);
  }, [advanceTurn, applyCard]);

  const handleStay = useCallback(() => {
    const meta = metaRef.current;
    if (!meta) return;
    let players = JSON.parse(meta.get('players') || '[]');
    const currentIdx = meta.get('currentPlayerIdx') ?? 0;
    players[currentIdx] = { ...players[currentIdx], stayed: true };
    meta.set('players', JSON.stringify(players));
    const allDone = players.every(p => p.busted || p.stayed);
    if (allDone) endRound(meta, players, JSON.parse(meta.get('cumulativeScores') || '{}'));
    else advanceTurn(meta, players);
  }, [advanceTurn]);

  const handleFreezeTarget = useCallback((targetUuid) => {
    const meta = metaRef.current;
    if (!meta) return;
    let players = JSON.parse(meta.get('players') || '[]');
    const idx = players.findIndex(p => p.uuid === targetUuid);
    if (idx !== -1) players[idx] = { ...players[idx], frozen: true };
    meta.set('players', JSON.stringify(players));
    meta.set('pendingAction', null);
    advanceTurn(meta, players);
  }, [advanceTurn]);

  const handleFlipThreeAssign = useCallback((targetUuid, cardIdx) => {
    const meta = metaRef.current;
    if (!meta) return;
    const pending = JSON.parse(meta.get('pendingAction') || 'null');
    if (!pending || pending.type !== 'flip-three') return;

    let players = JSON.parse(meta.get('players') || '[]');
    let deck = JSON.parse(meta.get('deck') || '[]');
    let discardPile = JSON.parse(meta.get('discardPile') || '[]');
    const card = pending.cards[cardIdx];
    const targetIdx = players.findIndex(p => p.uuid === targetUuid);
    if (targetIdx === -1) return;

    const { player: updated, extras } = applyCard(players[targetIdx], card, players, targetIdx);
    players[targetIdx] = updated;

    // The assigned card itself: if action, goes to discard after resolution
    if (card.type === 'action') discardPile.push(card);

    if (extras.giveSecondChanceTo !== undefined) {
      players[extras.giveSecondChanceTo] = { ...players[extras.giveSecondChanceTo], hasSecondChance: true };
    }
    if (extras.needsFreezeTarget) {
      players[targetIdx] = { ...players[targetIdx], frozen: true };
    }
    if (extras.needsFlipThree) {
      if (deck.length < 3) {
        deck = [...deck, ...shuffleCards(discardPile)];
        discardPile = [];
      }
      const extra3 = deck.slice(0, 3);
      deck = deck.slice(3);
      const active = players.map((_, i) => i).filter(i => !players[i].busted && !players[i].stayed);
      extra3.forEach(ec => {
        if (!active.length) { discardPile.push(ec); return; }
        const ri = active[Math.floor(Math.random() * active.length)];
        const { player: rp } = applyCard(players[ri], ec, players, ri);
        players[ri] = rp;
        if (ec.type === 'action') discardPile.push(ec);
      });
      meta.set('deck', JSON.stringify(deck));
      meta.set('discardPile', JSON.stringify(discardPile));
    }

    const remaining = pending.cards.filter((_, i) => i !== cardIdx);
    meta.set('players', JSON.stringify(players));
    meta.set('discardPile', JSON.stringify(discardPile));

    if (remaining.length === 0) {
      meta.set('pendingAction', null);
      const allDone = players.every(p => p.busted || p.stayed);
      if (allDone) endRound(meta, players, JSON.parse(meta.get('cumulativeScores') || '{}'));
      else advanceTurn(meta, players);
    } else {
      meta.set('pendingAction', JSON.stringify({ ...pending, cards: remaining, assignedCount: pending.assignedCount + 1 }));
    }
  }, [applyCard, advanceTurn]);

  const handleStartRound = useCallback(() => {
    const meta = metaRef.current;
    const yLobby = yLobbyRef.current;
    if (!meta || !yLobby) return;
    // Deduplicate before starting
    const all = yLobby.toArray();
    const seen = new Set();
    const unique = all.filter(p => { if (seen.has(p.uuid)) return false; seen.add(p.uuid); return true; });
    startRound(meta, unique);
  }, []);

  const handleNextRound = useCallback(() => {
    const meta = metaRef.current;
    const yLobby = yLobbyRef.current;
    if (!meta || !yLobby) return;
    meta.set('winner', null);
    const all = yLobby.toArray();
    const seen = new Set();
    startRound(meta, all.filter(p => { if (seen.has(p.uuid)) return false; seen.add(p.uuid); return true; }));
  }, []);

  const handlePlayAgain = useCallback(() => {
    const meta = metaRef.current;
    if (!meta) return;
    meta.set('cumulativeScores', '{}');
    meta.set('winner', null);
    meta.set('roundNum', 0);
    meta.set('phase', 'lobby');
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/flip-7/room/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const { phase, players, currentPlayerIdx, pendingAction, cumulativeScores, winner, roundNum, hostId } = gameState;
  const isHost = myUuid === hostId;
  const myPlayer = players.find(p => p.uuid === myUuid);
  const activePlayer = players[currentPlayerIdx];
  const isMyTurn = !pendingAction && activePlayer?.uuid === myUuid && !activePlayer?.busted && !activePlayer?.stayed;
  const isMyPendingAction = pendingAction?.drawerIdx !== undefined && players[pendingAction.drawerIdx]?.uuid === myUuid;
  const winnerPlayer = winner ? (players.find(p => p.uuid === winner) || lobbyPlayers.find(p => p.uuid === winner)) : null;

  const HeaderBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48, paddingLeft: 16, paddingRight: 16, borderBottom: `1px solid ${PANEL_BORDER}`, flexShrink: 0, backgroundColor: PANEL_DARK }}>
      <button onClick={() => router.push('/flip-7')} style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
        onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
        onMouseLeave={e => (e.currentTarget.style.color = TEXT_DIM)}
      >← Leave</button>
      <div style={{ width: 1, height: 20, backgroundColor: PANEL_BORDER }} />
      <img src="/assets/flip7.svg" alt="" style={{ width: 20 }} />
      <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 16, color: TEXT }}>
        Flip <span style={{ color: GAME_COLOR }}>7</span>
      </span>
      {roundNum > 0 && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: TEXT_DIM, backgroundColor: SURFACE, padding: '2px 8px', borderRadius: 5, border: `1px solid ${PANEL_BORDER}` }}>Round {roundNum}</span>}
      <div style={{ flex: 1 }} />
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: TEXT_DIM, letterSpacing: '1px' }}>{code}</span>
      <button onClick={copyLink} style={{ padding: '4px 10px', border: `1px solid ${copied ? GOLD : PANEL_BORDER}`, borderRadius: 6, backgroundColor: 'transparent', fontFamily: 'Inter, sans-serif', fontSize: 11, color: copied ? GOLD : TEXT_DIM, cursor: 'pointer' }}>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: TEXT_DIM + '66' }}>
        {peers === 0 ? '—' : `${peers} other${peers === 1 ? '' : 's'}`}
      </span>
    </div>
  );

  // ── LOBBY ────────────────────────────────────────────────────────────────────

  if (phase === 'connecting' || phase === 'lobby') {
    const canStart = isHost && lobbyPlayers.length >= 2;
    return (
      <>
        <Head><title>Room {code} — Flip 7</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column' }}>
          <HeaderBar />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <img src="/assets/flip7.svg" alt="" style={{ width: 40, marginBottom: 10, filter: `drop-shadow(0 0 10px ${GAME_GLOW})` }} />
                <h2 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 22, color: TEXT, margin: '0 0 4px 0' }}>
                  {phase === 'connecting' ? 'Connecting...' : 'Waiting for players'}
                </h2>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: TEXT_DIM, margin: 0 }}>
                  Share the room code · Need 2+ to start
                </p>
              </div>

              <div style={{ backgroundColor: PANEL, borderRadius: 16, border: `1px solid ${PANEL_BORDER}`, padding: '20px', marginBottom: 12 }}>
                {lobbyPlayers.map((p, i) => (
                  <div key={p.uuid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', backgroundColor: SURFACE, borderRadius: 10, border: `1px solid ${PANEL_BORDER}`, marginBottom: i < lobbyPlayers.length - 1 ? 6 : 0 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: TEXT, fontWeight: p.uuid === myUuid ? '700' : '400', flex: 1 }}>
                      {p.name}
                    </span>
                    {p.uuid === hostId && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: GAME_COLOR, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Host</span>}
                    {p.uuid === myUuid && p.uuid !== hostId && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: TEXT_DIM }}>you</span>}
                  </div>
                ))}
                {lobbyPlayers.length === 0 && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: TEXT_DIM + '55', textAlign: 'center', margin: 0 }}>Connecting...</p>
                )}
              </div>

              {isHost ? (
                <button onClick={handleStartRound} disabled={!canStart}
                  style={{ width: '100%', padding: '14px', backgroundColor: canStart ? GAME_COLOR : 'rgba(139,128,252,0.12)', color: canStart ? '#fff' : 'rgba(139,128,252,0.35)', border: 'none', borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: '700', cursor: canStart ? 'pointer' : 'not-allowed', boxShadow: canStart ? `0 4px 16px ${GAME_GLOW}` : 'none' }}
                >
                  {canStart ? 'Start Round →' : `Need ${Math.max(0, 2 - lobbyPlayers.length)} more player${lobbyPlayers.length < 1 ? 's' : ''}`}
                </button>
              ) : (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#8c80fc', textAlign: 'center' }}>
                  Waiting for host to start...
                </p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── PLAYING ──────────────────────────────────────────────────────────────────

  if (phase === 'playing') {
    const freezeTargets = pendingAction?.type === 'freeze'
      ? players.filter((p, i) => i !== pendingAction.drawerIdx && !p.busted && !p.stayed) : [];
    const flipThreeCards = pendingAction?.type === 'flip-three' ? pendingAction.cards : [];
    const flipThreeTargets = pendingAction?.type === 'flip-three'
      ? players.filter(p => !p.busted && !p.stayed) : [];
    const drawerName = pendingAction ? players[pendingAction.drawerIdx]?.name : null;

    return (
      <>
        <Head><title>Room {code} — Flip 7</title></Head>
        <div style={{ height: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <HeaderBar />

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Sidebar scoreboard */}
            <Scoreboard
              players={players}
              cumulativeScores={cumulativeScores}
              myUuid={myUuid}
              playerColors={PLAYER_COLORS}
              roundNum={roundNum}
            />

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Scrollable center: deck + player tables */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 16px', backgroundColor: SURFACE }}>
                {/* Deck area */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, marginBottom: 24, justifyContent: 'center' }}>
                  <DeckPile
                    count={gameState.deck.length}
                    isActive={isMyTurn}
                    onHit={handleHit}
                    animKey={drawAnimKey}
                  />
                  <LastDrawnCard card={lastDrawnCard} animKey={drawAnimKey} />
                </div>

                {/* Player tables — fixed 190px wide each */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {players.map((player, i) => {
                    const active = !pendingAction && i === currentPlayerIdx && !player.busted && !player.stayed;
                    const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
                    return (
                      <div key={player.uuid} style={{ position: 'relative', paddingTop: active ? 28 : 0, transition: 'padding-top 0.2s' }}>
                        {active && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: '700', color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                              {player.uuid === myUuid ? 'your turn' : 'their turn'}
                            </span>
                            <span style={{ color, fontSize: 13, animation: 'arrowBounce 0.7s ease-in-out infinite', display: 'inline-block' }}>▾</span>
                          </div>
                        )}
                        <PlayerTable
                          player={player}
                          isActive={active}
                          isMe={player.uuid === myUuid}
                          color={color}
                          roundScore={calcRoundScore(player)}
                          isCurrentRound={!player.busted}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action bar */}
              <div style={{ flexShrink: 0, backgroundColor: PANEL_DARK, borderTop: `1px solid ${PANEL_BORDER}`, padding: '14px 24px 16px' }}>

                {/* My turn — centered chip buttons */}
                {isMyTurn && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: TEXT_DIM, textAlign: 'center' }}>
                      Your turn
                      {myPlayer && myPlayer.numberCards.length > 0 && (
                        <> · <span style={{ color: GOLD, fontWeight: '700' }}>~{calcRoundScore(myPlayer)} pts</span></>
                      )}
                      {myPlayer?.numberCards.length === 7 && (
                        <span style={{ marginLeft: 6, color: GAME_COLOR, fontWeight: '700' }}>🎰 Flip 7!</span>
                      )}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <button onClick={handleHit}
                        style={{
                          width: 76, height: 76, borderRadius: '50%',
                          backgroundColor: GAME_COLOR, color: '#fff', border: 'none',
                          fontFamily: 'Nunito, sans-serif', fontSize: 18, fontWeight: '900',
                          cursor: 'pointer', letterSpacing: '1px',
                          boxShadow: `0 0 0 4px ${GAME_COLOR}33, 0 6px 20px ${GAME_GLOW}`,
                          animation: 'deckPulse 2.5s ease-in-out infinite',
                          transition: 'transform 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.07)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1.07)')}
                      >HIT</button>
                      <button onClick={handleStay}
                        disabled={!myPlayer || myPlayer.numberCards.length === 0}
                        style={{
                          width: 62, height: 62, borderRadius: '50%',
                          backgroundColor: 'transparent',
                          color: myPlayer?.numberCards.length > 0 ? TEXT : TEXT_DIM + '44',
                          border: `2px solid ${myPlayer?.numberCards.length > 0 ? PANEL_BORDER : PANEL_BORDER + '44'}`,
                          fontFamily: 'Nunito, sans-serif', fontSize: 13, fontWeight: '800',
                          cursor: myPlayer?.numberCards.length > 0 ? 'pointer' : 'not-allowed',
                          letterSpacing: '0.5px', transition: 'border-color 0.15s, transform 0.1s',
                        }}
                        onMouseEnter={e => { if (myPlayer?.numberCards.length > 0) { e.currentTarget.style.borderColor = TEXT_DIM; e.currentTarget.style.transform = 'scale(1.05)'; } }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = myPlayer?.numberCards.length > 0 ? PANEL_BORDER : PANEL_BORDER + '44'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >STAY</button>
                    </div>
                  </div>
                )}

                {/* Watching someone else */}
                {!isMyTurn && !pendingAction && activePlayer && !activePlayer.busted && !activePlayer.stayed && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: GAME_COLOR, animation: 'blink 1s infinite', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: TEXT_DIM }}>
                      <span style={{ color: TEXT, fontWeight: '700' }}>{activePlayer.name}</span>
                      {activePlayer.uuid === myUuid ? '' : ' is deciding...'}
                    </span>
                  </div>
                )}

                {/* Freeze targeting — my turn to pick */}
                {pendingAction?.type === 'freeze' && isMyPendingAction && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#60a5fa', fontWeight: '700' }}>❄️ Freeze — pick a target:</span>
                    {freezeTargets.map(t => (
                      <button key={t.uuid} onClick={() => handleFreezeTarget(t.uuid)}
                        style={{ padding: '7px 14px', backgroundColor: SURFACE, border: '2px solid #60a5fa55', borderRadius: 8, fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: '600', color: '#60a5fa', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#60a5fa')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#60a5fa55')}
                      >{t.name}</button>
                    ))}
                  </div>
                )}

                {/* Freeze — watching */}
                {pendingAction?.type === 'freeze' && !isMyPendingAction && (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#60a5fa' }}>
                      ❄️ <span style={{ fontWeight: '700' }}>{drawerName}</span> is choosing who to freeze...
                    </span>
                  </div>
                )}

                {/* Flip Three — my turn to assign */}
                {pendingAction?.type === 'flip-three' && isMyPendingAction && (
                  <FlipThreeAssigner cards={flipThreeCards} targets={flipThreeTargets} onAssign={handleFlipThreeAssign} />
                )}

                {/* Flip Three — watching */}
                {pendingAction?.type === 'flip-three' && !isMyPendingAction && (
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: GAME_COLOR }}>
                      <span style={{ fontWeight: '700' }}>{drawerName}</span> is dealing {flipThreeCards.length} card{flipThreeCards.length !== 1 ? 's' : ''}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rules button + panel */}
        <button
          onClick={() => setShowRules(v => !v)}
          style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 301, width: 40, height: 40, borderRadius: '50%', backgroundColor: showRules ? GAME_COLOR : PANEL, border: `2px solid ${showRules ? GAME_COLOR : PANEL_BORDER}`, color: showRules ? '#fff' : TEXT_DIM, fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'background-color 0.2s, border-color 0.2s' }}
        >?</button>
        <RulesPanel open={showRules} onClose={() => setShowRules(false)} />

        <style>{`
          @keyframes cardAppear {
            from { transform: scale(0.6) rotateY(90deg); opacity: 0; }
            to   { transform: scale(1) rotateY(0deg);   opacity: 1; }
          }
          @keyframes deckPulse {
            0%, 100% { box-shadow: 0 0 16px rgba(255,107,53,0.35); }
            50%       { box-shadow: 0 0 32px rgba(255,107,53,0.65); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; } 50% { opacity: 0.2; }
          }
          @keyframes arrowBounce {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(4px); }
          }
        `}</style>
      </>
    );
  }

  // ── ROUND END ────────────────────────────────────────────────────────────────

  if (phase === 'round-end') {
    const sorted = [...players].sort((a, b) => calcRoundScore(b) - calcRoundScore(a));
    return (
      <>
        <Head><title>Round {roundNum} Over — Flip 7</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column' }}>
          <HeaderBar />
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ maxWidth: 520, width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 32, color: TEXT, margin: '0 0 4px 0' }}>Round {roundNum} complete</h1>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: TEXT_DIM, margin: 0 }}>
                  {sorted.find(p => !p.busted)?.name} led this round
                </p>
              </div>

              {/* Round results */}
              <div style={{ backgroundColor: PANEL, borderRadius: 14, border: `1px solid ${PANEL_BORDER}`, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ padding: '10px 18px', borderBottom: `1px solid ${PANEL_BORDER}` }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: '700', color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Round Results</p>
                </div>
                {sorted.map((p, i) => {
                  const rs = calcRoundScore(p);
                  const cumScore = cumulativeScores[p.uuid] ?? 0;
                  const pi = players.findIndex(pl => pl.uuid === p.uuid);
                  return (
                    <div key={p.uuid} style={{ padding: '12px 18px', borderBottom: i < sorted.length - 1 ? `1px solid ${PANEL_BORDER}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: PLAYER_COLORS[pi % PLAYER_COLORS.length], flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: TEXT, fontWeight: '600' }}>{p.name}</span>
                          {p.busted && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#ff4d56', fontWeight: '700', backgroundColor: '#ff4d5622', padding: '1px 5px', borderRadius: 4 }}>BUST</span>}
                          {p.numberCards.length === 7 && !p.busted && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: GAME_COLOR, fontWeight: '700' }}>🎰 Flip 7!</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          {p.numberCards.map((n, j) => <NumberCard key={j} value={n} />)}
                          {p.modifierCards.map((m, j) => <ModifierCard key={j} value={m} />)}
                          {p.busted && p.bustCard !== null && p.bustCard !== undefined && (
                            <>
                              <div style={{ width: 1, height: 48, backgroundColor: '#ff4d5444', borderRadius: 1, alignSelf: 'center', marginLeft: 1, flexShrink: 0 }} />
                              <BustCard value={p.bustCard} />
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: '800', color: p.busted ? '#ff4d5666' : GOLD }}>{p.busted ? '0' : `+${rs}`}</div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: TEXT_DIM }}>→ {cumScore} total</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress leaderboard */}
              <div style={{ backgroundColor: PANEL, borderRadius: 14, border: `1px solid ${PANEL_BORDER}`, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ padding: '10px 18px', borderBottom: `1px solid ${PANEL_BORDER}` }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: '700', color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Race to 200</p>
                </div>
                {Object.entries(cumulativeScores).sort(([, a], [, b]) => b - a).map(([uuid, score], i) => {
                  const p = players.find(pl => pl.uuid === uuid) || lobbyPlayers.find(pl => pl.uuid === uuid);
                  const pi = players.findIndex(pl => pl.uuid === uuid);
                  return (
                    <div key={uuid} style={{ padding: '10px 18px', borderBottom: i < Object.keys(cumulativeScores).length - 1 ? `1px solid ${PANEL_BORDER}` : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: uuid === myUuid ? TEXT : TEXT_DIM, fontWeight: uuid === myUuid ? '700' : '400' }}>{p?.name}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: '700', color: score >= 200 ? GOLD : TEXT }}>{score} <span style={{ fontSize: 10, color: TEXT_DIM, fontWeight: '400' }}>/ 200</span></span>
                      </div>
                      <div style={{ height: 5, backgroundColor: SURFACE, borderRadius: 3 }}>
                        <div style={{ height: 5, backgroundColor: PLAYER_COLORS[pi >= 0 ? pi % PLAYER_COLORS.length : 0], borderRadius: 3, width: `${Math.min(score / 200, 1) * 100}%`, transition: 'width 0.7s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {isHost
                ? <button onClick={handleNextRound} style={{ width: '100%', padding: '14px', backgroundColor: GAME_COLOR, color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 16px ${GAME_GLOW}` }}>Next Round →</button>
                : <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: TEXT_DIM, textAlign: 'center' }}>Waiting for host to start next round...</p>
              }
            </div>
          </div>
        </div>
        <button onClick={() => setShowRules(v => !v)} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 301, width: 40, height: 40, borderRadius: '50%', backgroundColor: showRules ? GAME_COLOR : PANEL, border: `2px solid ${showRules ? GAME_COLOR : PANEL_BORDER}`, color: showRules ? '#fff' : TEXT_DIM, fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', transition: 'background-color 0.2s' }}>?</button>
        <RulesPanel open={showRules} onClose={() => setShowRules(false)} />
        <style>{`@keyframes cardAppear { from { transform: scale(0.6) rotateY(90deg); opacity: 0; } to { transform: scale(1) rotateY(0deg); opacity: 1; } }`}</style>
      </>
    );
  }

  // ── GAME OVER ────────────────────────────────────────────────────────────────

  if (phase === 'game-over') {
    const sortedScores = Object.entries(cumulativeScores).sort(([, a], [, b]) => b - a);
    return (
      <>
        <Head><title>Game Over — Flip 7</title></Head>
        <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', flexDirection: 'column' }}>
          <HeaderBar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
            <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
              <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 36, color: GOLD, margin: '0 0 6px 0' }}>{winnerPlayer?.name || '?'}</h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: TEXT_DIM, margin: '0 0 32px 0' }}>reached 200 in Round {roundNum}</p>

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
                ? <button onClick={handlePlayAgain} style={{ width: '100%', padding: '14px', backgroundColor: GAME_COLOR, color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 16px ${GAME_GLOW}` }}>Play Again →</button>
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
