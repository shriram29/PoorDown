import { buildDeck, shuffleCards, handPoints } from './deck';

export function makePlayer(uuid, name) {
  return { uuid, name, hand: [] };
}

export function canPlayCard(card, topCard, currentColor) {
  if (!topCard) return card.type === 'wild' || card.type === 'wild-draw-four';
  if (card.type === 'wild' || card.type === 'wild-draw-four') return true;
  if (card.color === currentColor) return true;
  if (card.type !== 'number' && card.type === topCard.type) return true;
  if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
  return false;
}

export function drawFromDeck(deck, discardPile, count) {
  let d = [...deck];
  let dp = [...discardPile];
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (d.length === 0) {
      if (dp.length <= 1) break;
      const top = dp[dp.length - 1];
      d = shuffleCards(dp.slice(0, -1));
      dp = [top];
    }
    if (d.length > 0) drawn.push(d.shift());
  }
  return { drawn, deck: d, discardPile: dp };
}

export function startHand(meta, lobbyPlayers) {
  let deck = buildDeck();
  let discardPile = [];

  const players = lobbyPlayers.map(p => makePlayer(p.uuid, p.name));

  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < players.length; j++) {
      players[j].hand.push(deck.shift());
    }
  }

  // Flip starting card — skip Wild Draw Fours back into deck
  let startCard;
  for (;;) {
    startCard = deck.shift();
    if (startCard.type !== 'wild-draw-four') break;
    deck.push(startCard);
    deck = shuffleCards(deck);
  }
  discardPile.push(startCard);

  const n = players.length;
  let direction = 1;
  let startIdx = (meta.get('nextHandStartIdx') ?? 0) % n;
  let currentColor = startCard.color || 'red';

  if (startCard.type === 'skip') {
    startIdx = (startIdx + 1) % n;
  } else if (startCard.type === 'reverse') {
    direction = -1;
    startIdx = n === 2 ? startIdx : ((startIdx - 1 + n) % n);
  } else if (startCard.type === 'draw-two') {
    const { drawn, deck: d2, discardPile: dp2 } = drawFromDeck(deck, discardPile, 2);
    players[startIdx].hand.push(...drawn);
    deck = d2;
    discardPile = dp2;
    startIdx = (startIdx + 1) % n;
  } else if (startCard.type === 'wild') {
    currentColor = 'red';
  }

  meta.set('phase', 'playing');
  meta.set('deck', JSON.stringify(deck));
  meta.set('discardPile', JSON.stringify(discardPile));
  meta.set('players', JSON.stringify(players));
  meta.set('currentPlayerIdx', startIdx);
  meta.set('direction', direction);
  meta.set('currentColor', currentColor);
  meta.set('pendingAction', null);
  meta.set('roundNum', (meta.get('roundNum') ?? 0) + 1);
}

export function endHand(meta, players, prevScores) {
  const winner = players.find(p => p.hand.length === 0);
  if (!winner) return;

  const points = players
    .filter(p => p.uuid !== winner.uuid)
    .reduce((sum, p) => sum + handPoints(p.hand), 0);

  const newScores = { ...prevScores };
  newScores[winner.uuid] = (newScores[winner.uuid] ?? 0) + points;
  meta.set('cumulativeScores', JSON.stringify(newScores));

  const currentIdx = meta.get('currentPlayerIdx') ?? 0;
  meta.set('nextHandStartIdx', (currentIdx + 1) % players.length);

  const leader = Object.entries(newScores)
    .filter(([, s]) => s >= 500)
    .sort(([, a], [, b]) => b - a)[0];

  if (leader) {
    meta.set('winner', leader[0]);
    meta.set('phase', 'game-over');
  } else {
    meta.set('winnerUuid', winner.uuid);
    meta.set('phase', 'hand-end');
  }
}
