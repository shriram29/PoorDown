const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const shuffleCards = shuffle;

// 94 cards total: 79 number, 6 modifier, 9 action
export function buildDeck() {
  const cards = [];
  cards.push({ type: 'number', value: 0 });
  for (let v = 1; v <= 12; v++) {
    for (let i = 0; i < v; i++) cards.push({ type: 'number', value: v });
  }
  ['+2', '+4', '+6', '+8', '+10', 'x2'].forEach(v =>
    cards.push({ type: 'modifier', value: v })
  );
  ['freeze', 'flip-three', 'second-chance'].forEach(v => {
    for (let i = 0; i < 3; i++) cards.push({ type: 'action', value: v });
  });
  return shuffle(cards);
}
