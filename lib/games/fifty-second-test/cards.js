const SUITS = [
  { name: 'Spades', symbol: '♠', color: '#2B2D42' },
  { name: 'Hearts', symbol: '♥', color: '#E63946' },
  { name: 'Diamonds', symbol: '♦', color: '#E63946' },
  { name: 'Clubs', symbol: '♣', color: '#2B2D42' },
];

const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, id: `${value}-${suit.name}` });
    }
  }
  return deck;
}

module.exports = { buildDeck, SUITS, VALUES };
