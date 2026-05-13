const COLORS = ['red', 'yellow', 'green', 'blue'];
let _id = 0;
const uid = () => `u${++_id}`;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const shuffleCards = shuffle;

export function buildDeck() {
  const cards = [];
  COLORS.forEach(color => {
    cards.push({ id: uid(), type: 'number', color, value: 0 });
    for (let v = 1; v <= 9; v++) {
      cards.push({ id: uid(), type: 'number', color, value: v });
      cards.push({ id: uid(), type: 'number', color, value: v });
    }
    cards.push({ id: uid(), type: 'skip', color, value: null });
    cards.push({ id: uid(), type: 'skip', color, value: null });
    cards.push({ id: uid(), type: 'reverse', color, value: null });
    cards.push({ id: uid(), type: 'reverse', color, value: null });
    cards.push({ id: uid(), type: 'draw-two', color, value: null });
    cards.push({ id: uid(), type: 'draw-two', color, value: null });
  });
  for (let i = 0; i < 4; i++) cards.push({ id: uid(), type: 'wild', color: null, value: null });
  for (let i = 0; i < 4; i++) cards.push({ id: uid(), type: 'wild-draw-four', color: null, value: null });
  return shuffle(cards);
}

export function cardPoints(card) {
  if (card.type === 'number') return card.value;
  if (card.type === 'skip' || card.type === 'reverse' || card.type === 'draw-two') return 20;
  return 50;
}

export function handPoints(hand) {
  return hand.reduce((sum, c) => sum + cardPoints(c), 0);
}
