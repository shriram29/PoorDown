import { WORDS } from './words';

export function generateBoard() {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  const words = shuffled.slice(0, 25);
  const firstTeam = Math.random() < 0.5 ? 'red' : 'blue';
  const secondTeam = firstTeam === 'red' ? 'blue' : 'red';

  const types = [
    ...Array(9).fill(firstTeam),
    ...Array(8).fill(secondTeam),
    ...Array(7).fill('neutral'),
    'assassin',
  ];

  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  return { words, keyCard: types, firstTeam };
}
