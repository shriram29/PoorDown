import { EASY_WORDS, HARD_WORDS } from './words';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateBoard() {
  const easy = shuffle(EASY_WORDS);
  const hard = shuffle(HARD_WORDS);

  const firstTeam = Math.random() < 0.5 ? 'red' : 'blue';
  const secondTeam = firstTeam === 'red' ? 'blue' : 'red';

  // Each team gets a mix: first team (9) = 6 easy + 3 hard
  //                       second team (8) = 5 easy + 3 hard
  //                       neutral (7)     = 4 easy + 3 hard
  //                       assassin (1)    = 1 hard
  // Total: 15 easy + 10 hard = 25
  const slots = [
    ...easy.slice(0, 6).map(w => ({ word: w, type: firstTeam })),
    ...hard.slice(0, 3).map(w => ({ word: w, type: firstTeam })),

    ...easy.slice(6, 11).map(w => ({ word: w, type: secondTeam })),
    ...hard.slice(3, 6).map(w => ({ word: w, type: secondTeam })),

    ...easy.slice(11, 15).map(w => ({ word: w, type: 'neutral' })),
    ...hard.slice(6, 9).map(w => ({ word: w, type: 'neutral' })),

    { word: hard[9], type: 'assassin' },
  ];

  const shuffled = shuffle(slots);

  return {
    words: shuffled.map(s => s.word),
    keyCard: shuffled.map(s => s.type),
    firstTeam,
  };
}
