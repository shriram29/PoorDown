// Y.js game state management
import * as Y from 'yjs';
import { BOARD_SPACES, DEFAULT_CONFIG } from './board';

let ydoc = null;
let provider = null;
let awareness = null;

// Initialize Y.js document and PartyKit connection
export function initGame(roomId, playerName, host = false) {
  ydoc = new Y.Doc();
  
  // Shared types
  const yPlayers = ydoc.getArray('players');
  const yBoard = ydoc.getMap('board');
  const yConfig = ydoc.getMap('config');
  const yPhase = ydoc.getText('phase');
  const yDice = ydoc.getArray('dice');
  const yDoublesCount = ydoc.getNumber('doublesCount') || 0;
  const yCurrentPlayer = ydoc.getNumber('currentPlayer') || 0;
  const yGameOver = ydoc.getBoolean('gameOver') || false;
  const yWinner = ydoc.getText('winner');

  // Initialize game state if host
  if (host && yPlayers.length === 0) {
    yConfig.set('startingCash', DEFAULT_CONFIG.startingCash);
    yConfig.set('auctionEnabled', DEFAULT_CONFIG.auctionEnabled);
    yConfig.set('mortgageEnabled', DEFAULT_CONFIG.mortgageEnabled);
    yConfig.set('freeParkingJackpot', DEFAULT_CONFIG.freeParkingJackpot);
    yConfig.set('jailFine', DEFAULT_CONFIG.jailFine);
    yConfig.set('speedDie', DEFAULT_CONFIG.speedDie);
    yConfig.set('maxPlayers', DEFAULT_CONFIG.maxPlayers);
    
    yPhase.insert(0, 'setup');
    yDice.push([0, 0]);
    ydoc.getNumber('doublesCount', 0);
    ydoc.getNumber('currentPlayer', 0);
    ydoc.getBoolean('gameOver', false);
  }

  return {
    ydoc,
    yPlayers,
    yBoard,
    yConfig,
    yPhase,
    yDice,
    yDoublesCount,
    yCurrentPlayer,
    yGameOver,
    yWinner,
    // Convenience getters
    getPlayers: () => yPlayers.toArray(),
    getPhase: () => yPhase.toString(),
    getDice: () => yDice.toArray(),
    getCurrentPlayer: () => ydoc.getNumber('currentPlayer') || 0,
    isGameOver: () => ydoc.getBoolean('gameOver'),
  };
}

// Add a player to the game
export function addPlayer(ydoc, playerId, name, color, isBot = false) {
  const yPlayers = ydoc.getArray('players');
  const yConfig = ydoc.getMap('config');
  const startingCash = yConfig.get('startingCash') || 1500;
  
  const player = {
    id: playerId,
    name,
    color,
    cash: startingCash,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0,
    getOutOfJailFree: false,
    isBot,
    isEliminated: false,
  };
  
  yPlayers.push([player]);
  return player;
}

// Remove a player
export function removePlayer(ydoc, playerId) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.id === playerId);
  if (idx !== -1) {
    yPlayers.delete(idx, 1);
  }
}

// Get player by index
export function getPlayer(ydoc, index) {
  const yPlayers = ydoc.getArray('players');
  return yPlayers.toArray()[index];
}

// Get player by ID
export function getPlayerById(ydoc, playerId) {
  const yPlayers = ydoc.getArray('players');
  return yPlayers.toArray().find(p => p.id === playerId);
}

// Update player position
export function updatePlayerPosition(ydoc, playerId, position) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.id === playerId);
  if (idx !== -1) {
    const player = { ...arr[idx], position };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

// Update player cash
export function updatePlayerCash(ydoc, playerId, cashDelta) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.id === playerId);
  if (idx !== -1) {
    const player = { ...arr[idx], cash: arr[idx].cash + cashDelta };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

// Set player cash (absolute)
export function setPlayerCash(ydoc, playerId, cash) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.id === playerId);
  if (idx !== -1) {
    const player = { ...arr[idx], cash };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

// Add property to player
export function addPropertyToPlayer(ydoc, playerId, propertyId) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.id === playerId);
  if (idx !== -1) {
    const player = { ...arr[idx], properties: [...arr[idx].properties, propertyId] };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

// Remove property from player
export function removePropertyFromPlayer(ydoc, playerId, propertyId) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.id === playerId);
  if (idx !== -1) {
    const player = { ...arr[idx], properties: arr[idx].properties.filter(pid => pid !== propertyId) };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

// Update property ownership
export function setPropertyOwner(ydoc, propertyId, ownerId) {
  const yBoard = ydoc.getMap('board');
  const current = yBoard.get(propertyId) || { owner: null, houses: 0, mortgaged: false };
  yBoard.set(propertyId, { ...current, owner: ownerId });
}

// Get property state
export function getPropertyState(ydoc, propertyId) {
  const yBoard = ydoc.getMap('board');
  return yBoard.get(propertyId) || { owner: null, houses: 0, mortgaged: false };
}

// Set property houses
export function setPropertyHouses(ydoc, propertyId, houses) {
  const yBoard = ydoc.getMap('board');
  const current = yBoard.get(propertyId) || { owner: null, houses: 0, mortgaged: false };
  yBoard.set(propertyId, { ...current, houses });
}

// Set property mortgaged
export function setPropertyMortgaged(ydoc, propertyId, mortgaged) {
  const yBoard = ydoc.getMap('board');
  const current = yBoard.get(propertyId) || { owner: null, houses: 0, mortgaged: false };
  yBoard.set(propertyId, { ...current, mortgaged });
}

// Roll dice and update state
export function rollDice(ydoc) {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  
  const yDice = ydoc.getArray('dice');
  const yDoublesCount = ydoc.getNumber('doublesCount') || 0;
  
  // Clear and set new dice
  while (yDice.length > 0) yDice.delete(0);
  yDice.push([die1, die2]);
  
  const isDoubles = die1 === die2;
  const newDoublesCount = isDoubles ? yDoublesCount + 1 : 0;
  ydoc.getNumber('doublesCount', 0);
  
  return { die1, die2, isDoubles, total: die1 + die2, doublesCount: newDoublesCount };
}

// Move player to new position
export function movePlayer(ydoc, playerId, newPosition) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.id === playerId);
  
  if (idx !== -1) {
    let pos = arr[idx].position;
    const passedGo = newPosition < pos; // wrapped around board
    let cashBonus = 0;
    
    if (passedGo && arr[idx].position > 0) {
      cashBonus = 200; // passed Go
    }
    
    let newPos = newPosition;
    if (newPos < 0) newPos += 40;
    newPos = newPos % 40;
    
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

// Set current player
export function setCurrentPlayer(ydoc, index) {
  ydoc.getNumber('currentPlayer', index);
}

// End turn - advance to next player
export function endTurn(ydoc) {
  const yPlayers = ydoc.getArray('players');
  const current = ydoc.getNumber('currentPlayer') || 0;
  const next = (current + 1) % yPlayers.length;
  
  // Skip eliminated players
  let nextPlayer = next;
  let attempts = 0;
  while (ydoc.getArray('players').toArray()[nextPlayer]?.isEliminated && attempts < yPlayers.length) {
    nextPlayer = (nextPlayer + 1) % yPlayers.length;
    attempts++;
  }
  
  ydoc.getNumber('currentPlayer', nextPlayer);
  
  // Reset doubles count when turn ends without doubles
  ydoc.getNumber('doublesCount', 0);
}

// Set phase
export function setPhase(ydoc, phase) {
  const yPhase = ydoc.getText('phase');
  yPhase.delete(0, yPhase.length);
  yPhase.insert(0, phase);
}

// Set game over
export function setGameOver(ydoc, winnerName) {
  ydoc.getBoolean('gameOver', true);
  const yWinner = ydoc.getText('winner');
  yWinner.delete(0, yWinner.length);
  yWinner.insert(0, winnerName || '');
}

// Get space info
export function getSpace(spaceId) {
  return BOARD_SPACES[spaceId];
}

// Calculate rent for a property
export function calculateRent(propertyId, playerId, ydoc) {
  const space = BOARD_SPACES[propertyId];
  if (!space || space.type !== 'property') return 0;
  
  const propertyState = getPropertyState(ydoc, propertyId);
  if (propertyState.mortgaged) return 0;
  
  // Railroads
  if (space.type === 'railroad') {
    const owner = propertyState.owner;
    if (!owner) return 0;
    const ownerPlayer = getPlayerById(ydoc, owner);
    const railroadsOwned = ownerPlayer?.properties.filter(pid => BOARD_SPACES[pid]?.type === 'railroad').length || 0;
    return 25 * Math.pow(2, railroadsOwned - 1);
  }
  
  // Utilities
  if (space.type === 'utility') {
    const owner = propertyState.owner;
    if (!owner) return 0;
    const dice = ydoc.getArray('dice').toArray();
    const total = dice.reduce((a, b) => a + b, 0);
    // Either 4x or 10x based on if both utilities owned
    const ownerPlayer = getPlayerById(ydoc, owner);
    const utilitiesOwned = ownerPlayer?.properties.filter(pid => BOARD_SPACES[pid]?.type === 'utility').length || 0;
    const multiplier = utilitiesOwned === 2 ? 10 : 4;
    return total * multiplier;
  }
  
  // Regular property rent
  const { houses } = propertyState;
  return space.rent[houses] || space.rent[0];
}

// Check if player owns all of a color group
export function ownsColorSet(ydoc, playerId, colorGroup) {
  const player = getPlayerById(ydoc, playerId);
  if (!player) return false;
  
  const propertiesInGroup = BOARD_SPACES.filter(s => s.group === colorGroup).map(s => s.id);
  return propertiesInGroup.every(pid => player.properties.includes(pid));
}

// Check if can build on a property (owns all of color set, enough cash, uniform houses)
export function canBuildHouse(ydoc, playerId, propertyId) {
  const space = BOARD_SPACES[propertyId];
  if (!space || !space.group || space.group === 'railroad' || space.group === 'utility') return false;
  
  const player = getPlayerById(ydoc, playerId);
  if (!player) return false;
  
  // Must own all of color set
  if (!ownsColorSet(ydoc, playerId, space.group)) return false;
  
  // Must have enough cash
  if (player.cash < space.housePrice) return false;
  
  // Check house uniformity - must have equal houses on all properties in group
  const propertiesInGroup = BOARD_SPACES.filter(s => s.group === space.group);
  const houseCounts = propertiesInGroup.map(pid => getPropertyState(ydoc, pid)?.houses || 0);
  const maxHouses = Math.max(...houseCounts);
  const targetHouses = (getPropertyState(ydoc, propertyId)?.houses || 0) + 1;
  
  // Can't skip houses - must be uniform (except can build hotel on max houses)
  if (targetHouses <= maxHouses || targetHouses > 5) return false;
  
  return true;
}

// Buy property
export function buyProperty(ydoc, playerId, propertyId) {
  const space = BOARD_SPACES[propertyId];
  if (!space || !space.price) return { success: false, reason: 'Not purchasable' };
  
  const player = getPlayerById(ydoc, playerId);
  if (!player) return { success: false, reason: 'Player not found' };
  
  if (player.cash < space.price) return { success: false, reason: 'Not enough cash' };
  
  if (getPropertyState(ydoc, propertyId).owner) return { success: false, reason: 'Already owned' };
  
  // Deduct cash and add property
  updatePlayerCash(ydoc, playerId, -space.price);
  addPropertyToPlayer(ydoc, playerId, propertyId);
  setPropertyOwner(ydoc, propertyId, playerId);
  
  return { success: true };
}

// Sell house
export function sellHouse(ydoc, playerId, propertyId) {
  const space = BOARD_SPACES[propertyId];
  if (!space || !space.housePrice) return { success: false, reason: 'Cannot sell houses' };
  
  const propertyState = getPropertyState(ydoc, propertyId);
  if (propertyState.owner !== playerId) return { success: false, reason: 'Not owner' };
  if (propertyState.houses <= 0) return { success: false, reason: 'No houses to sell' };
  
  const sellPrice = Math.floor(space.housePrice / 2);
  updatePlayerCash(ydoc, playerId, sellPrice);
  setPropertyHouses(ydoc, propertyId, propertyState.houses - 1);
  
  return { success: true };
}

// Mortgage property
export function mortgageProperty(ydoc, playerId, propertyId) {
  const space = BOARD_SPACES[propertyId];
  if (!space || !space.price) return { success: false, reason: 'Cannot mortgage' };
  
  const propertyState = getPropertyState(ydoc, propertyId);
  if (propertyState.owner !== playerId) return { success: false, reason: 'Not owner' };
  if (propertyState.mortgaged) return { success: false, reason: 'Already mortgaged' };
  if (propertyState.houses > 0) return { success: false, reason: 'Must sell houses first' };
  
  const mortgageValue = Math.floor(space.price / 2);
  updatePlayerCash(ydoc, playerId, mortgageValue);
  setPropertyMortgaged(ydoc, propertyId, true);
  
  return { success: true };
}

// Unmortgage property
export function unmortgageProperty(ydoc, playerId, propertyId) {
  const space = BOARD_SPACES[propertyId];
  if (!space || !space.price) return { success: false, reason: 'Cannot unmortgage' };
  
  const propertyState = getPropertyState(ydoc, propertyId);
  if (propertyState.owner !== playerId) return { success: false, reason: 'Not owner' };
  if (!propertyState.mortgaged) return { success: false, reason: 'Not mortgaged' };
  
  const unmortgagePrice = Math.floor(space.price / 2 * 1.1); // 10% interest
  const player = getPlayerById(ydoc, playerId);
  
  if (player.cash < unmortgagePrice) return { success: false, reason: 'Not enough cash' };
  
  updatePlayerCash(ydoc, playerId, -unmortgagePrice);
  setPropertyMortgaged(ydoc, propertyId, false);
  
  return { success: true };
}

// Send player to jail
export function sendToJail(ydoc, playerId) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.id === playerId);
  
  if (idx !== -1) {
    const player = { ...arr[idx], position: 10, inJail: true, jailTurns: 0 };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

// Escape jail
export function escapeJail(ydoc, playerId, method = 'pay') {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.id === playerId);
  
  if (idx !== -1) {
    if (method === 'pay') {
      updatePlayerCash(ydoc, playerId, -50);
    }
    const player = { ...arr[idx], inJail: false, jailTurns: 0 };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

// Mark player as eliminated
export function eliminatePlayer(ydoc, playerId) {
  const yPlayers = ydoc.getArray('players');
  const arr = yPlayers.toArray();
  const idx = arr.findIndex(p => p.id === playerId);
  
  if (idx !== -1) {
    const player = { ...arr[idx], isEliminated: true, cash: 0 };
    yPlayers.delete(idx, 1);
    yPlayers.insert(idx, [player]);
  }
}

// Get active players (not eliminated)
export function getActivePlayers(ydoc) {
  const yPlayers = ydoc.getArray('players');
  return yPlayers.toArray().filter(p => !p.isEliminated);
}

// Check win condition
export function checkWin(ydoc) {
  const activePlayers = getActivePlayers(ydoc);
  if (activePlayers.length === 1) {
    setGameOver(ydoc, activePlayers[0].name);
    return activePlayers[0];
  }
  return null;
}