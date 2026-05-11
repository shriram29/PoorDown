import { generateBoard } from './engine';

export function leaveGame(meta, yPlayers, uuid) {
  const players = yPlayers.toArray();
  const leaving = players.find(p => p.uuid === uuid);
  const remaining = players.filter(p => p.uuid !== uuid);
  const phase = meta.get('phase');

  if (leaving && ['spymaster-clue', 'operatives-guess', 'spymaster-needed'].includes(phase)) {
    const { team, role } = leaving;
    const otherTeam = team === 'red' ? 'blue' : 'red';
    const teamAfter      = remaining.filter(p => p.team === team);
    const spymastersLeft = teamAfter.filter(p => p.role === 'spymaster');
    const operativesLeft = teamAfter.filter(p => p.role === 'operative');

    if (role === 'spymaster' && spymastersLeft.length === 0) {
      if (operativesLeft.length > 0) {
        meta.set('phase', 'spymaster-needed');
        meta.set('spymasterNeededTeam', team);
        meta.set('spymasterNeededDeadline', Date.now() + 60000);
      } else {
        meta.set('phase', 'over');
        meta.set('winner', otherTeam);
        meta.set('winReason', 'forfeit');
      }
    } else if (role === 'operative' && operativesLeft.length === 0) {
      meta.set('phase', 'over');
      meta.set('winner', otherTeam);
      meta.set('winReason', 'forfeit');
    }
  }

  if (meta.get('hostId') === uuid && remaining.length > 0) {
    const next = [...remaining].sort((a, b) => a.joinedAt - b.joinedAt)[0];
    meta.set('hostId', next.uuid);
  }

  const idx = players.findIndex(p => p.uuid === uuid);
  if (idx !== -1) yPlayers.delete(idx, 1);
}

export function volunteerAsSpymaster(meta, yPlayers, uuid) {
  const players = yPlayers.toArray();
  const idx = players.findIndex(p => p.uuid === uuid);
  if (idx === -1) return;
  yPlayers.delete(idx, 1);
  yPlayers.insert(idx, [{ ...players[idx], role: 'spymaster' }]);
  meta.set('phase', 'spymaster-clue');
  meta.set('spymasterNeededTeam', null);
  meta.set('spymasterNeededDeadline', null);
}

export function forfeitByTimeout(meta, team) {
  if (meta.get('phase') !== 'spymaster-needed') return;
  const winner = team === 'red' ? 'blue' : 'red';
  meta.set('phase', 'over');
  meta.set('winner', winner);
  meta.set('winReason', 'forfeit');
  meta.set('spymasterNeededTeam', null);
  meta.set('spymasterNeededDeadline', null);
}

function initBoardInMeta(meta, yRevealed) {
  const { words, keyCard, firstTeam } = generateBoard();
  const redCount  = keyCard.filter(t => t === 'red').length;
  const blueCount = keyCard.filter(t => t === 'blue').length;
  for (let i = 0; i < 25; i++) yRevealed.set(String(i), false);
  meta.set('words',         JSON.stringify(words));
  meta.set('keyCard',       JSON.stringify(keyCard));
  meta.set('firstTeam',     firstTeam);
  meta.set('currentTeam',   firstTeam);
  meta.set('redRemaining',  redCount);
  meta.set('blueRemaining', blueCount);
}

function resetVetoState(meta) {
  meta.set('gridRedReady',    false);
  meta.set('gridBlueReady',   false);
  meta.set('gridRedVetoUsed', false);
  meta.set('gridBlueVetoUsed',false);
  meta.set('gridRedAction',   null);
  meta.set('gridBlueAction',  null);
}

export function startGame(meta, yRevealed) {
  initBoardInMeta(meta, yRevealed);
  meta.set('phase',        'grid-veto');
  meta.set('clueWord',     '');
  meta.set('clueNumber',   0);
  meta.set('guessesLeft',  0);
  meta.set('winner',       null);
  meta.set('winReason',    null);
  meta.set('rematchVotes', '[]');
  resetVetoState(meta);
}

export function recordTeamVote(meta, team, action) {
  if (action === 'veto') {
    meta.set(team === 'red' ? 'gridRedVetoUsed' : 'gridBlueVetoUsed', true);
  }
  meta.set(team === 'red' ? 'gridRedAction' : 'gridBlueAction', action);
  meta.set(team === 'red' ? 'gridRedReady'  : 'gridBlueReady',  true);
}

// Only the host calls this — single client generates the new board to avoid divergence.
export function resolveGridVote(meta, yRevealed) {
  if (!meta.get('gridRedReady') || !meta.get('gridBlueReady')) return;

  const redAction    = meta.get('gridRedAction');
  const blueAction   = meta.get('gridBlueAction');
  const redVetoUsed  = meta.get('gridRedVetoUsed');
  const blueVetoUsed = meta.get('gridBlueVetoUsed');

  if (redAction === 'veto' || blueAction === 'veto') {
    initBoardInMeta(meta, yRevealed);
    meta.set('gridRedReady',  false);
    meta.set('gridBlueReady', false);
    meta.set('gridRedAction', null);
    meta.set('gridBlueAction',null);
    if (redVetoUsed && blueVetoUsed) {
      meta.set('phase', 'spymaster-clue');
    }
  } else {
    meta.set('phase', 'spymaster-clue');
  }
}

export function submitClue(meta, word, number) {
  const guessesLeft = number === 0 ? 99 : number + 1;
  meta.set('clueWord',    word);
  meta.set('clueNumber',  number);
  meta.set('guessesLeft', guessesLeft);
  meta.set('phase',       'operatives-guess');
}

export function revealCard(meta, yRevealed, index) {
  const keyCard     = JSON.parse(meta.get('keyCard') || '[]');
  const cardType    = keyCard[index];
  const currentTeam = meta.get('currentTeam');

  yRevealed.set(String(index), true);

  if (cardType === 'assassin') {
    const winner = currentTeam === 'red' ? 'blue' : 'red';
    meta.set('winner',    winner);
    meta.set('winReason', 'assassin');
    meta.set('phase',     'over');
    return { cardType, gameOver: true };
  }

  const redWas  = meta.get('redRemaining');
  const blueWas = meta.get('blueRemaining');
  const newRed  = cardType === 'red'  ? redWas  - 1 : redWas;
  const newBlue = cardType === 'blue' ? blueWas - 1 : blueWas;

  if (cardType === 'red')  meta.set('redRemaining',  newRed);
  if (cardType === 'blue') meta.set('blueRemaining', newBlue);

  if (newRed === 0) {
    meta.set('winner',    'red');
    meta.set('winReason', 'found-all');
    meta.set('phase',     'over');
    return { cardType, gameOver: true };
  }
  if (newBlue === 0) {
    meta.set('winner',    'blue');
    meta.set('winReason', 'found-all');
    meta.set('phase',     'over');
    return { cardType, gameOver: true };
  }

  if (cardType !== currentTeam) {
    endTurn(meta);
    return { cardType, gameOver: false };
  }

  const guessesLeft = meta.get('guessesLeft');
  if (guessesLeft < 99) {
    const next = guessesLeft - 1;
    meta.set('guessesLeft', next);
    if (next <= 0) {
      endTurn(meta);
      return { cardType, gameOver: false };
    }
  }

  return { cardType, gameOver: false };
}

export function endTurn(meta) {
  const next = meta.get('currentTeam') === 'red' ? 'blue' : 'red';
  meta.set('currentTeam', next);
  meta.set('phase',       'spymaster-clue');
  meta.set('clueWord',    '');
  meta.set('clueNumber',  0);
  meta.set('guessesLeft', 0);
}

export function voteRematch(meta, uuid) {
  const votes = JSON.parse(meta.get('rematchVotes') || '[]');
  if (votes.includes(uuid)) return;
  meta.set('rematchVotes', JSON.stringify([...votes, uuid]));
}

// Only the host calls this after detecting 2+2 votes.
export function triggerRematch(meta, yPlayers, yRevealed) {
  const players     = yPlayers.toArray();
  const prevRedSpy  = meta.get('prevRedSpymaster')  || null;
  const prevBlueSpy = meta.get('prevBlueSpymaster') || null;

  const redAll   = players.filter(p => p.team === 'red');
  const blueAll  = players.filter(p => p.team === 'blue');
  const redPool  = redAll.filter(p => p.uuid !== prevRedSpy);
  const bluePool = blueAll.filter(p => p.uuid !== prevBlueSpy);

  const pick = (pool, fallback) => {
    const src = pool.length > 0 ? pool : fallback;
    return src[Math.floor(Math.random() * src.length)];
  };
  const newRedSpy  = pick(redPool,  redAll);
  const newBlueSpy = pick(bluePool, blueAll);

  meta.set('prevRedSpymaster',  newRedSpy?.uuid  || null);
  meta.set('prevBlueSpymaster', newBlueSpy?.uuid || null);

  const updated = players.map(p => {
    if (!p.team) return p;
    const isSpy = p.uuid === newRedSpy?.uuid || p.uuid === newBlueSpy?.uuid;
    return { ...p, role: isSpy ? 'spymaster' : 'operative' };
  });
  yPlayers.delete(0, yPlayers.length);
  yPlayers.insert(0, updated);

  initBoardInMeta(meta, yRevealed);
  meta.set('phase',        'grid-veto');
  meta.set('clueWord',     '');
  meta.set('clueNumber',   0);
  meta.set('guessesLeft',  0);
  meta.set('winner',       null);
  meta.set('winReason',    null);
  meta.set('rematchVotes', '[]');
  resetVetoState(meta);
}

export function requeueToLobby(meta, yPlayers) {
  const players = yPlayers.toArray();
  const updated = players.map(p => ({ ...p, role: null }));
  yPlayers.delete(0, yPlayers.length);
  yPlayers.insert(0, updated);

  meta.set('phase',        'lobby');
  meta.set('words',        null);
  meta.set('keyCard',      null);
  meta.set('winner',       null);
  meta.set('winReason',    null);
  meta.set('clueWord',     '');
  meta.set('clueNumber',   0);
  meta.set('guessesLeft',  0);
  meta.set('rematchVotes', '[]');
  resetVetoState(meta);
}
