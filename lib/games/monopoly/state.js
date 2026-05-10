import * as Y from 'yjs';
import { BOARD_SPACES, DEFAULT_CONFIG } from './board';

export function initGame(roomId, isHost = false) {
  const ydoc = new Y.Doc();
  const meta = ydoc.getMap('meta');
  const yPlayers = ydoc.getArray('players');
  const yBoard = ydoc.getMap('board');
  const yConfig = ydoc.getMap('config');

  if (isHost) {
    meta.set('phase', 'setup');
    meta.set('currentPlayer', 0);
    meta.set('doublesCount', 0);
    meta.set('dice', [0, 0]);
    meta.set('gameOver', false);
    meta.set('winner', null);
    meta.set('turnNumber', 0);

    yConfig.set('startingCash', DEFAULT_CONFIG.startingCash ?? 1500);
    yConfig.set('auctionEnabled', DEFAULT_CONFIG.auctionEnabled ?? true);
    yConfig.set('mortgageEnabled', DEFAULT_CONFIG.mortgageEnabled ?? true);
    yConfig.set('freeParkingJackpot', DEFAULT_CONFIG.freeParkingJackpot ?? 0);
    yConfig.set('jailFine', DEFAULT_CONFIG.jailFine ?? 50);
    yConfig.set('maxPlayers', DEFAULT_CONFIG.maxPlayers ?? 8);
  }

  return { ydoc, meta, yPlayers, yBoard, yConfig };
}

export function addPlayer(ydoc, uuid, name, color) {
  const yPlayers = ydoc.getArray('players');
  const yConfig = ydoc.getMap('config');
  const startingCash = yConfig.get('startingCash') ?? 1500;

  const player = {
    uuid,
    name,
    color,
    cash: startingCash,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0,
    getOutOfJailFree: 0,
    isEliminated: false,
    joinedAt: Date.now(),
  };

  yPlayers.push([player]);
  return player;
}

export function removePlayer(ydoc, playerId) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.uuid === playerId);
  if (idx !== -1) {
    yPlayers.delete(idx, 1);
  }
}

export function getPlayer(ydoc, index) {
  return ydoc.getArray('players').toArray()[index];
}

export function getPlayerById(ydoc, playerId) {
  return ydoc.getArray('players').toArray().find(p => p.uuid === playerId);
}

export function updatePlayerPosition(ydoc, playerId, position) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.uuid === playerId);
  if (idx !== -1) {
    const player = { ...arr[idx], position };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

export function updatePlayerCash(ydoc, playerId, cashDelta) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.uuid === playerId);
  if (idx !== -1) {
    const player = { ...arr[idx], cash: arr[idx].cash + cashDelta };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

export function setPlayerCash(ydoc, playerId, cash) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.uuid === playerId);
  if (idx !== -1) {
    const player = { ...arr[idx], cash };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

export function addPropertyToPlayer(ydoc, playerId, propertyId) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.uuid === playerId);
  if (idx !== -1) {
    const player = { ...arr[idx], properties: [...arr[idx].properties, propertyId] };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

export function removePropertyFromPlayer(ydoc, playerId, propertyId) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.uuid === playerId);
  if (idx !== -1) {
    const player = { ...arr[idx], properties: arr[idx].properties.filter(pid => pid !== propertyId) };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

export function setPropertyOwner(ydoc, propertyId, ownerId) {
  const yBoard = ydoc.getMap('board');
  const current = yBoard.get(propertyId) || { owner: null, houses: 0, mortgaged: false };
  yBoard.set(propertyId, { ...current, owner: ownerId });
}

export function getPropertyState(ydoc, propertyId) {
  return ydoc.getMap('board').get(propertyId) || { owner: null, houses: 0, mortgaged: false };
}

export function setPropertyHouses(ydoc, propertyId, houses) {
  const yBoard = ydoc.getMap('board');
  const current = yBoard.get(propertyId) || { owner: null, houses: 0, mortgaged: false };
  yBoard.set(propertyId, { ...current, houses });
}

export function setPropertyMortgaged(ydoc, propertyId, mortgaged) {
  const yBoard = ydoc.getMap('board');
  const current = yBoard.get(propertyId) || { owner: null, houses: 0, mortgaged: false };
  yBoard.set(propertyId, { ...current, mortgaged });
}

export function rollDice(ydoc) {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const meta = ydoc.getMap('meta');
  const prevDoublesCount = meta.get('doublesCount') ?? 0;

  const isDoubles = die1 === die2;
  const newDoublesCount = isDoubles ? prevDoublesCount + 1 : 0;

  meta.set('dice', [die1, die2]);
  meta.set('doublesCount', newDoublesCount);

  return { die1, die2, isDoubles, total: die1 + die2, doublesCount: newDoublesCount };
}

export function movePlayer(ydoc, playerId, newPosition) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.uuid === playerId);

  if (idx !== -1) {
    const pos = arr[idx].position;
    let newPos = newPosition < 0 ? newPosition + 40 : newPosition % 40;
    const passedGo = newPos < pos && arr[idx].position > 0;
    const cashBonus = passedGo ? 200 : 0;

    const player = { ...arr[idx], position: newPos };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);

    if (cashBonus > 0) {
      updatePlayerCash(ydoc, playerId, cashBonus);
    }

    return { passedGo, newPosition: newPos };
  }

  return { passedGo: false, newPosition };
}

export function setCurrentPlayer(ydoc, index) {
  ydoc.getMap('meta').set('currentPlayer', index);
}

export function endTurn(ydoc) {
  const meta = ydoc.getMap('meta');
  const yPlayers = ydoc.getArray('players');
  const players = yPlayers.toArray();
  const current = meta.get('currentPlayer') ?? 0;
  let next = (current + 1) % players.length;

  let attempts = 0;
  while (players[next]?.isEliminated && attempts < players.length) {
    next = (next + 1) % players.length;
    attempts++;
  }

  meta.set('currentPlayer', next);
  meta.set('doublesCount', 0);
}

export function setPhase(ydoc, phase) {
  ydoc.getMap('meta').set('phase', phase);
}

export function setGameOver(ydoc, winnerName) {
  const meta = ydoc.getMap('meta');
  meta.set('gameOver', true);
  meta.set('winner', winnerName || null);
}

export function getSpace(spaceId) {
  return BOARD_SPACES[spaceId];
}

export function calculateRent(propertyId, playerId, ydoc) {
  const space = BOARD_SPACES[propertyId];
  if (!space) return 0;

  const propertyState = getPropertyState(ydoc, propertyId);
  if (propertyState.mortgaged) return 0;

  if (space.type === 'railroad') {
    const owner = propertyState.owner;
    if (!owner) return 0;
    const ownerPlayer = getPlayerById(ydoc, owner);
    const railroadsOwned = ownerPlayer?.properties.filter(pid => BOARD_SPACES[pid]?.type === 'railroad').length || 0;
    return 25 * Math.pow(2, railroadsOwned - 1);
  }

  if (space.type === 'utility') {
    const owner = propertyState.owner;
    if (!owner) return 0;
    const dice = ydoc.getMap('meta').get('dice') ?? [0, 0];
    const total = dice.reduce((a, b) => a + b, 0);
    const ownerPlayer = getPlayerById(ydoc, owner);
    const utilitiesOwned = ownerPlayer?.properties.filter(pid => BOARD_SPACES[pid]?.type === 'utility').length || 0;
    const multiplier = utilitiesOwned === 2 ? 10 : 4;
    return total * multiplier;
  }

  if (space.type !== 'property') return 0;

  const { houses } = propertyState;
  return space.rent[houses] || space.rent[0];
}

export function ownsColorSet(ydoc, playerId, colorGroup) {
  const player = getPlayerById(ydoc, playerId);
  if (!player) return false;

  const propertiesInGroup = BOARD_SPACES.filter(s => s.group === colorGroup).map(s => s.id);
  return propertiesInGroup.every(pid => player.properties.includes(pid));
}

export function canBuildHouse(ydoc, playerId, propertyId) {
  const space = BOARD_SPACES[propertyId];
  if (!space || !space.group || space.group === 'railroad' || space.group === 'utility') return false;

  const player = getPlayerById(ydoc, playerId);
  if (!player) return false;

  if (!ownsColorSet(ydoc, playerId, space.group)) return false;
  if (player.cash < space.housePrice) return false;

  const propertiesInGroup = BOARD_SPACES.filter(s => s.group === space.group);
  const houseCounts = propertiesInGroup.map(pid => getPropertyState(ydoc, pid)?.houses || 0);
  const maxHouses = Math.max(...houseCounts);
  const targetHouses = (getPropertyState(ydoc, propertyId)?.houses || 0) + 1;

  if (targetHouses <= maxHouses || targetHouses > 5) return false;

  return true;
}

export function buyProperty(ydoc, playerId, propertyId) {
  const space = BOARD_SPACES[propertyId];
  if (!space || !space.price) return { success: false, reason: 'Not purchasable' };

  const player = getPlayerById(ydoc, playerId);
  if (!player) return { success: false, reason: 'Player not found' };

  if (player.cash < space.price) return { success: false, reason: 'Not enough cash' };
  if (getPropertyState(ydoc, propertyId).owner) return { success: false, reason: 'Already owned' };

  updatePlayerCash(ydoc, playerId, -space.price);
  addPropertyToPlayer(ydoc, playerId, propertyId);
  setPropertyOwner(ydoc, propertyId, playerId);

  return { success: true };
}

export function sellHouse(ydoc, playerId, propertyId) {
  const space = BOARD_SPACES[propertyId];
  if (!space || !space.housePrice) return { success: false, reason: 'Cannot sell houses' };

  const propertyState = getPropertyState(ydoc, propertyId);
  if (propertyState.owner !== playerId) return { success: false, reason: 'Not owner' };
  if (propertyState.houses <= 0) return { success: false, reason: 'No houses to sell' };

  updatePlayerCash(ydoc, playerId, Math.floor(space.housePrice / 2));
  setPropertyHouses(ydoc, propertyId, propertyState.houses - 1);

  return { success: true };
}

export function mortgageProperty(ydoc, playerId, propertyId) {
  const space = BOARD_SPACES[propertyId];
  if (!space || !space.price) return { success: false, reason: 'Cannot mortgage' };

  const propertyState = getPropertyState(ydoc, propertyId);
  if (propertyState.owner !== playerId) return { success: false, reason: 'Not owner' };
  if (propertyState.mortgaged) return { success: false, reason: 'Already mortgaged' };
  if (propertyState.houses > 0) return { success: false, reason: 'Must sell houses first' };

  updatePlayerCash(ydoc, playerId, Math.floor(space.price / 2));
  setPropertyMortgaged(ydoc, propertyId, true);

  return { success: true };
}

export function unmortgageProperty(ydoc, playerId, propertyId) {
  const space = BOARD_SPACES[propertyId];
  if (!space || !space.price) return { success: false, reason: 'Cannot unmortgage' };

  const propertyState = getPropertyState(ydoc, propertyId);
  if (propertyState.owner !== playerId) return { success: false, reason: 'Not owner' };
  if (!propertyState.mortgaged) return { success: false, reason: 'Not mortgaged' };

  const unmortgagePrice = Math.floor(space.price / 2 * 1.1);
  const player = getPlayerById(ydoc, playerId);
  if (player.cash < unmortgagePrice) return { success: false, reason: 'Not enough cash' };

  updatePlayerCash(ydoc, playerId, -unmortgagePrice);
  setPropertyMortgaged(ydoc, propertyId, false);

  return { success: true };
}

export function sendToJail(ydoc, playerId) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.uuid === playerId);

  if (idx !== -1) {
    const player = { ...arr[idx], position: 10, inJail: true, jailTurns: 0 };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

export function escapeJail(ydoc, playerId, method = 'pay') {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.uuid === playerId);

  if (idx !== -1) {
    if (method === 'pay') {
      updatePlayerCash(ydoc, playerId, -50);
    }
    const player = { ...arr[idx], inJail: false, jailTurns: 0 };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

export function eliminatePlayer(ydoc, playerId) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.uuid === playerId);

  if (idx !== -1) {
    const player = { ...arr[idx], isEliminated: true, cash: 0 };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

export function getActivePlayers(ydoc) {
  return ydoc.getArray('players').toArray().filter(p => !p.isEliminated);
}

export function checkWin(ydoc) {
  const activePlayers = getActivePlayers(ydoc);
  if (activePlayers.length === 1) {
    setGameOver(ydoc, activePlayers[0].name);
    return activePlayers[0];
  }
  return null;
}

export function getMeta(ydoc) {
  return ydoc.getMap('meta');
}

export function getPhase(ydoc) {
  return ydoc.getMap('meta').get('phase') ?? 'setup';
}

export function getDice(ydoc) {
  return ydoc.getMap('meta').get('dice') ?? [0, 0];
}

export function getCurrentPlayerIndex(ydoc) {
  return ydoc.getMap('meta').get('currentPlayer') ?? 0;
}

export function proposeTrade(ydoc, tradeOffer) {
  const yTrades = ydoc.getMap('trades');
  yTrades.set(tradeOffer.id, tradeOffer);
}

export function acceptTrade(ydoc, tradeId) {
  const yTrades = ydoc.getMap('trades');
  const trade = yTrades.get(tradeId);
  if (!trade || trade.status !== 'pending') return { success: false };

  updatePlayerCash(ydoc, trade.fromUuid, -trade.fromCash + trade.toCash);
  updatePlayerCash(ydoc, trade.toUuid, -trade.toCash + trade.fromCash);

  trade.fromProperties.forEach(propId => {
    removePropertyFromPlayer(ydoc, trade.fromUuid, propId);
    addPropertyToPlayer(ydoc, trade.toUuid, propId);
    setPropertyOwner(ydoc, propId, trade.toUuid);
  });

  trade.toProperties.forEach(propId => {
    removePropertyFromPlayer(ydoc, trade.toUuid, propId);
    addPropertyToPlayer(ydoc, trade.fromUuid, propId);
    setPropertyOwner(ydoc, propId, trade.fromUuid);
  });

  yTrades.set(tradeId, { ...trade, status: 'accepted' });
  return { success: true };
}

export function rejectTrade(ydoc, tradeId) {
  const yTrades = ydoc.getMap('trades');
  const trade = yTrades.get(tradeId);
  if (!trade) return;
  yTrades.set(tradeId, { ...trade, status: 'rejected' });
}

export function getPendingTrades(ydoc, playerUuid) {
  const yTrades = ydoc.getMap('trades');
  const trades = [];
  yTrades.forEach((trade) => {
    if (trade.toUuid === playerUuid && trade.status === 'pending') {
      trades.push(trade);
    }
  });
  return trades;
}
