import { updatePlayerCash, getPlayerById, sendToJail, getPropertyState, getActivePlayers, movePlayer, updatePlayerPosition } from './state';
import { BOARD_SPACES } from './board';

const RAILROAD_POSITIONS = [5, 15, 25, 35];
const UTILITY_POSITIONS = [12, 28];

export const CHANCE_CARDS = [
  { id: 'ch-1', deck: 'chance', text: 'Advance to GO (Collect $200)', type: 'moveTo', position: 0 },
  { id: 'ch-2', deck: 'chance', text: 'Advance to Illinois Avenue', type: 'moveTo', position: 24 },
  { id: 'ch-3', deck: 'chance', text: 'Advance to St. Charles Place', type: 'moveTo', position: 11 },
  { id: 'ch-4', deck: 'chance', text: 'Advance token to nearest Utility. If unowned, you may buy it. If owned, pay 10× dice roll', type: 'moveToNearest', nearestType: 'utility' },
  { id: 'ch-5', deck: 'chance', text: 'Advance token to nearest Railroad. Pay owner twice the rental', type: 'moveToNearest', nearestType: 'railroad' },
  { id: 'ch-6', deck: 'chance', text: 'Bank pays you dividend of $50', type: 'cash', amount: 50 },
  { id: 'ch-7', deck: 'chance', text: 'Get Out of Jail Free', type: 'getOutOfJail' },
  { id: 'ch-8', deck: 'chance', text: 'Go Back 3 Spaces', type: 'back3' },
  { id: 'ch-9', deck: 'chance', text: 'Go to Jail. Go directly to Jail — do not pass GO, do not collect $200', type: 'goToJail' },
  { id: 'ch-10', deck: 'chance', text: 'Make general repairs on all your property: $25 per house, $100 per hotel', type: 'taxPerHouse', perHouse: 25, perHotel: 100 },
  { id: 'ch-11', deck: 'chance', text: 'Speeding fine $15', type: 'cash', amount: -15 },
  { id: 'ch-12', deck: 'chance', text: 'Take a trip to Reading Railroad', type: 'moveTo', position: 5 },
  { id: 'ch-13', deck: 'chance', text: 'Take a walk on the Boardwalk. Advance token to Boardwalk', type: 'moveTo', position: 39 },
  { id: 'ch-14', deck: 'chance', text: 'You have been elected Chairman of the Board. Pay each player $50', type: 'payToAll', perPlayer: 50 },
  { id: 'ch-15', deck: 'chance', text: 'Your building loan matures. Collect $150', type: 'cash', amount: 150 },
  { id: 'ch-16', deck: 'chance', text: 'You have won a crossword competition. Collect $100', type: 'cash', amount: 100 },
];

export const COMMUNITY_CHEST_CARDS = [
  { id: 'cc-1', deck: 'communityChest', text: 'Advance to GO (Collect $200)', type: 'moveTo', position: 0 },
  { id: 'cc-2', deck: 'communityChest', text: 'Bank error in your favor. Collect $200', type: 'cash', amount: 200 },
  { id: 'cc-3', deck: 'communityChest', text: "Doctor's fee. Pay $50", type: 'cash', amount: -50 },
  { id: 'cc-4', deck: 'communityChest', text: 'From sale of stock you get $50', type: 'cash', amount: 50 },
  { id: 'cc-5', deck: 'communityChest', text: 'Get Out of Jail Free', type: 'getOutOfJail' },
  { id: 'cc-6', deck: 'communityChest', text: 'Go to Jail', type: 'goToJail' },
  { id: 'cc-7', deck: 'communityChest', text: 'Grand Opera Night. Collect $50 from every player', type: 'collectFromAll', perPlayer: 50 },
  { id: 'cc-8', deck: 'communityChest', text: 'Holiday Fund matures. Receive $100', type: 'cash', amount: 100 },
  { id: 'cc-9', deck: 'communityChest', text: 'Income tax refund. Collect $20', type: 'cash', amount: 20 },
  { id: 'cc-10', deck: 'communityChest', text: 'It is your birthday. Collect $10 from every player', type: 'collectFromAll', perPlayer: 10 },
  { id: 'cc-11', deck: 'communityChest', text: 'Life insurance matures. Collect $100', type: 'cash', amount: 100 },
  { id: 'cc-12', deck: 'communityChest', text: 'Pay hospital fees of $100', type: 'cash', amount: -100 },
  { id: 'cc-13', deck: 'communityChest', text: 'Pay school fees of $50', type: 'cash', amount: -50 },
  { id: 'cc-14', deck: 'communityChest', text: 'Receive $25 consultancy fee', type: 'cash', amount: 25 },
  { id: 'cc-15', deck: 'communityChest', text: 'You are assessed for street repairs: $40 per house, $115 per hotel', type: 'taxPerHouse', perHouse: 40, perHotel: 115 },
  { id: 'cc-16', deck: 'communityChest', text: 'You have won second prize in a beauty contest. Collect $10', type: 'cash', amount: 10 },
];

export function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function initCardDecks(ydoc) {
  const yCards = ydoc.getMap('cards');
  yCards.set('chance', shuffleDeck(CHANCE_CARDS));
  yCards.set('chanceIndex', 0);
  yCards.set('communityChest', shuffleDeck(COMMUNITY_CHEST_CARDS));
  yCards.set('communityChestIndex', 0);
}

export function drawCard(ydoc, deck) {
  const yCards = ydoc.getMap('cards');
  const deckKey = deck === 'chance' ? 'chance' : 'communityChest';
  const indexKey = deck === 'chance' ? 'chanceIndex' : 'communityChestIndex';

  let cards = yCards.get(deckKey);
  let index = yCards.get(indexKey) ?? 0;

  if (index >= cards.length) {
    cards = shuffleDeck(cards);
    yCards.set(deckKey, cards);
    index = 0;
  }

  const card = cards[index];
  yCards.set(indexKey, index + 1);
  return card;
}

function findNearest(currentPosition, spaces) {
  const distances = spaces.map(s => {
    const dist = (s - currentPosition + 40) % 40;
    return { position: s, distance: dist };
  });
  return distances.sort((a, b) => a.distance - b.distance)[0].position;
}

export function applyCardEffect(ydoc, card, playerId, allPlayerIds) {
  const player = getPlayerById(ydoc, playerId);
  if (!player) return { description: 'Player not found', needsLandingResolution: false, newPosition: null };

  switch (card.type) {
    case 'cash': {
      updatePlayerCash(ydoc, playerId, card.amount);
      const action = card.amount >= 0 ? `Collect $${card.amount}` : `Pay $${Math.abs(card.amount)}`;
      return { description: action, needsLandingResolution: false, newPosition: null };
    }

    case 'moveTo': {
      const { passedGo, newPosition } = movePlayer(ydoc, playerId, card.position);
      const goText = passedGo ? ' (collected $200 for passing GO)' : '';
      return {
        description: `Moved to space ${card.position}${goText}`,
        needsLandingResolution: true,
        newPosition,
      };
    }

    case 'moveToNearest': {
      const spaces = card.nearestType === 'railroad' ? RAILROAD_POSITIONS : UTILITY_POSITIONS;
      const target = findNearest(player.position, spaces);
      const { passedGo, newPosition } = movePlayer(ydoc, playerId, target);
      const goText = passedGo ? ' (collected $200 for passing GO)' : '';
      const typeLabel = card.nearestType === 'railroad' ? 'railroad' : 'utility';
      return {
        description: `Moved to nearest ${typeLabel} at space ${target}${goText}`,
        needsLandingResolution: true,
        newPosition,
      };
    }

    case 'collectFromAll': {
      const activePlayers = getActivePlayers(ydoc);
      const others = activePlayers.filter(p => p.uuid !== playerId);
      let totalCollected = 0;
      for (const other of others) {
        updatePlayerCash(ydoc, other.uuid, -card.perPlayer);
        totalCollected += card.perPlayer;
      }
      updatePlayerCash(ydoc, playerId, totalCollected);
      return {
        description: `Collected $${card.perPlayer} from each player ($${totalCollected} total)`,
        needsLandingResolution: false,
        newPosition: null,
      };
    }

    case 'payToAll': {
      const activePlayers = getActivePlayers(ydoc);
      const others = activePlayers.filter(p => p.uuid !== playerId);
      let totalPaid = 0;
      for (const other of others) {
        updatePlayerCash(ydoc, other.uuid, card.perPlayer);
        totalPaid += card.perPlayer;
      }
      updatePlayerCash(ydoc, playerId, -totalPaid);
      return {
        description: `Paid $${card.perPlayer} to each player ($${totalPaid} total)`,
        needsLandingResolution: false,
        newPosition: null,
      };
    }

    case 'getOutOfJail': {
      const yPlayers = ydoc.getArray('players');
      const arr = yPlayers.toArray();
      const idx = arr.findIndex(p => p.uuid === playerId);
      if (idx !== -1) {
        const updated = { ...arr[idx], getOutOfJailFree: (arr[idx].getOutOfJailFree || 0) + 1 };
        yPlayers.delete(idx, 1);
        yPlayers.insert(idx, [updated]);
      }
      return { description: 'Received a Get Out of Jail Free card', needsLandingResolution: false, newPosition: null };
    }

    case 'goToJail': {
      sendToJail(ydoc, playerId);
      return { description: 'Sent to Jail', needsLandingResolution: false, newPosition: 10 };
    }

    case 'back3': {
      const newPos = (player.position - 3 + 40) % 40;
      updatePlayerPosition(ydoc, playerId, newPos);
      return {
        description: `Moved back 3 spaces to space ${newPos}`,
        needsLandingResolution: true,
        newPosition: newPos,
      };
    }

    case 'taxPerHouse': {
      let houseCount = 0;
      let hotelCount = 0;
      for (const propertyId of player.properties) {
        const state = getPropertyState(ydoc, propertyId);
        if (state.houses === 5) {
          hotelCount++;
        } else {
          houseCount += state.houses;
        }
      }
      const total = houseCount * card.perHouse + hotelCount * card.perHotel;
      if (total > 0) {
        updatePlayerCash(ydoc, playerId, -total);
      }
      return {
        description: `Street repairs: ${houseCount} house(s) × $${card.perHouse} + ${hotelCount} hotel(s) × $${card.perHotel} = $${total}`,
        needsLandingResolution: false,
        newPosition: null,
      };
    }

    default:
      return { description: `Unknown card effect: ${card.type}`, needsLandingResolution: false, newPosition: null };
  }
}
