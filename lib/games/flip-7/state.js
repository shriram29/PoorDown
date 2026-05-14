import { buildDeck, shuffleCards } from './deck';

export function makePlayer(uuid, name) {
  return {
    uuid,
    name,
    numberCards: [],
    modifierCards: [],
    hasSecondChance: false,
    secondChanceCard: null,
    busted: false,
    bustCard: null,
    stayed: false,
    frozen: false,
  };
}

export function calcRoundScore(player) {
  if (player.busted) return 0;
  const numSum = player.numberCards.reduce((s, v) => s + v, 0);
  const hasX2 = player.modifierCards.includes('x2');
  const base = hasX2 ? numSum * 2 : numSum;
  const flat = player.modifierCards
    .filter(m => m !== 'x2')
    .reduce((s, m) => s + parseInt(m, 10), 0);
  const flip7Bonus = player.numberCards.length === 7 ? 15 : 0;
  return base + flat + flip7Bonus;
}

export function startRound(meta, lobbyPlayers) {
  // Move previous round's player cards into the persistent discard pile
  const prevPlayers = JSON.parse(meta.get('players') || '[]');
  let discardPile = JSON.parse(meta.get('discardPile') || '[]');
  prevPlayers.forEach(p => {
    p.numberCards.forEach(v => discardPile.push({ type: 'number', value: v }));
    p.modifierCards.forEach(v => discardPile.push({ type: 'modifier', value: v }));
  });

  // Carry forward the existing deck; build fresh only for the very first round
  let deck = JSON.parse(meta.get('deck') || 'null');
  if (!deck) {
    deck = buildDeck();
    discardPile = [];
  } else if (deck.length === 0) {
    deck = shuffleCards(discardPile);
    discardPile = [];
  }

  const players = lobbyPlayers.map(p => makePlayer(p.uuid, p.name));
  const startIdx = (meta.get('nextRoundStartIdx') ?? 0) % lobbyPlayers.length;

  meta.set('phase', 'playing');
  meta.set('deck', JSON.stringify(deck));
  meta.set('discardPile', JSON.stringify(discardPile));
  meta.set('players', JSON.stringify(players));
  meta.set('currentPlayerIdx', startIdx);
  meta.set('pendingAction', null);
  meta.set('pendingQueue', '[]');
  meta.set('roundNum', (meta.get('roundNum') ?? 0) + 1);
}

export function endRound(meta, players, prevScores) {
  const newScores = { ...prevScores };
  players.forEach(p => {
    newScores[p.uuid] = (newScores[p.uuid] ?? 0) + calcRoundScore(p);
  });
  meta.set('cumulativeScores', JSON.stringify(newScores));

  const currentIdx = meta.get('currentPlayerIdx') ?? 0;
  meta.set('nextRoundStartIdx', (currentIdx + 1) % players.length);

  const above200 = Object.entries(newScores)
    .filter(([, s]) => s >= 200)
    .sort(([, a], [, b]) => b - a);

  if (above200.length > 0 && (above200.length === 1 || above200[0][1] > above200[1][1])) {
    meta.set('winner', above200[0][0]);
    meta.set('phase', 'game-over');
  } else {
    meta.set('phase', 'round-end');
  }
}
