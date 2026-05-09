import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import Board from '../../components/board/Board';
import Dice from '../../components/dice/Dice';
import PlayerHUD from '../../components/hud/PlayerHUD';
import ActionBar from '../../components/hud/ActionBar';
import PropertyModal from '../../components/modals/PropertyModal';
import TradeModal from '../../components/modals/TradeModal';
import PropertyManagementModal from '../../components/modals/PropertyManagementModal';
import GameConfigModal from '../../components/modals/GameConfigModal';
import SpaceDetailModal from '../../components/modals/SpaceDetailModal';
import { BOARD_SPACES, PLAYER_COLORS, GROUP_COLORS } from '../../lib/game/board';
import {
  addPlayer,
  getPlayerById,
  rollDice,
  movePlayer,
  buyProperty,
  endTurn,
  getPropertyState,
  calculateRent,
  addPropertyToPlayer,
  removePropertyFromPlayer,
  updatePlayerCash,
  setPropertyOwner,
  getActivePlayers,
  checkWin,
  sendToJail,
  escapeJail,
  eliminatePlayer,
  setCurrentPlayer,
  proposeTrade,
  acceptTrade,
  rejectTrade,
  setPropertyHouses,
  mortgageProperty,
  unmortgageProperty,
  canBuildHouse,
} from '../../lib/game/state';
import { initCardDecks, drawCard, applyCardEffect } from '../../lib/game/cards';
import { useToast } from '../../lib/useToast';
import Toast from '../../components/ui/Toast';
import ReconnectBanner from '../../components/ui/ReconnectBanner';
import Confetti from '../../components/ui/Confetti';

export default function GameRoom() {
  const router = useRouter();
  const { code } = router.query;

  const [myIdentity, setMyIdentity] = useState(null);
  const [ydoc, setYdoc] = useState(null);
  const [players, setPlayers] = useState([]);
  const [phase, setPhaseState] = useState('connecting');
  const [dice, setDice] = useState([0, 0]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [isHost, setIsHostState] = useState(false);
  const [propertyModal, setPropertyModal] = useState({ isOpen: false, propertyId: null });
  const [gameWinner, setGameWinner] = useState(null);
  const [doublesCount, setDoublesCount] = useState(0);
  const [hasRolled, setHasRolled] = useState(false);
  const [lastCard, setLastCard] = useState(null);
  const [auctionState, setAuctionState] = useState(null);
  const [tradeModal, setTradeModal] = useState({ isOpen: false, mode: 'propose', tradeOffer: null });
  const [propertyMgmtModal, setPropertyMgmtModal] = useState(false);
  const [configModal, setConfigModal] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [disconnectedPlayers, setDisconnectedPlayers] = useState([]);
  const [spaceDetailModal, setSpaceDetailModal] = useState({ isOpen: false, spaceId: null });
  const { toasts, toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('poordown_identity');
    if (stored) {
      try { setMyIdentity(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!code || !myIdentity) return;

    const doc = new Y.Doc();
    const roomId = `poordown-${code}`;

    const webrtcProvider = new WebrtcProvider(roomId, doc, {
      signaling: ['wss://signaling.yjs.dev'],
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
      maxConns: 8,
    });

    const awareness = webrtcProvider.awareness;

    awareness.setLocalStateField('player', {
      uuid: myIdentity.uuid,
      name: myIdentity.name,
    });

    awareness.on('change', () => {
      const meta = doc.getMap('meta');
      const hostId = meta.get('hostId');
      if (!hostId) return;

      const connected = Array.from(awareness.getStates().values())
        .map(s => s.player?.uuid)
        .filter(Boolean);

      if (!connected.includes(hostId)) {
        const playersList = doc.getArray('players').toArray()
          .filter(p => !p.isEliminated)
          .sort((a, b) => a.joinedAt - b.joinedAt);

        const disconnectedNames = doc.getArray('players').toArray()
          .filter(p => !connected.includes(p.uuid) && !p.isEliminated)
          .map(p => p.name);
        setDisconnectedPlayers(disconnectedNames);

        const newHost = playersList.find(p => connected.includes(p.uuid));
        if (newHost && newHost.uuid === myIdentity.uuid) {
          meta.set('hostId', myIdentity.uuid);
          setIsHostState(true);
          toast('You are now the host', 'info');
        }
      } else {
        setDisconnectedPlayers([]);
      }
    });

    setTimeout(() => {
      const meta = doc.getMap('meta');
      const yPlayers = doc.getArray('players');

      if (!meta.get('hostId')) {
        meta.set('hostId', myIdentity.uuid);
        meta.set('phase', 'setup');
        meta.set('currentPlayer', 0);
        meta.set('doublesCount', 0);
        meta.set('dice', [0, 0]);
        meta.set('gameOver', false);
        meta.set('winner', null);
        meta.set('turnNumber', 0);
        const yConfig = doc.getMap('config');
        yConfig.set('startingCash', 1500);
        yConfig.set('auctionEnabled', true);
        yConfig.set('mortgageEnabled', true);
        yConfig.set('freeParkingJackpot', 0);
        yConfig.set('jailFine', 50);
        yConfig.set('maxPlayers', 8);
        setIsHostState(true);
      } else {
        setIsHostState(meta.get('hostId') === myIdentity.uuid);
      }

      const existingPlayer = yPlayers.toArray().find(p => p.uuid === myIdentity.uuid);
      if (!existingPlayer) {
        const colorIndex = yPlayers.length % PLAYER_COLORS.length;
        addPlayer(doc, myIdentity.uuid, myIdentity.name, PLAYER_COLORS[colorIndex]);
      }

      const updateState = () => {
        setPlayers(yPlayers.toArray());
        const currentPhase = meta.get('phase') ?? 'setup';
        setPhaseState(currentPhase);
        setDice(meta.get('dice') ?? [0, 0]);
        setCurrentPlayerIndex(meta.get('currentPlayer') ?? 0);
        setDoublesCount(meta.get('doublesCount') ?? 0);
        if (meta.get('gameOver')) setGameWinner(meta.get('winner'));
        setIsHostState(meta.get('hostId') === myIdentity.uuid);

        const auctionPropId = meta.get('auctionPropertyId');
        if (auctionPropId != null) {
          setAuctionState({
            propertyId: auctionPropId,
            currentBid: meta.get('auctionBid') ?? 0,
            highBidder: meta.get('auctionHighBidder') ?? null,
            passed: meta.get('auctionPassed') ?? [],
          });
        } else {
          setAuctionState(null);
        }
      };

      meta.observe(updateState);
      yPlayers.observe(updateState);
      updateState();

      setYdoc(doc);
      setMyPlayerId(myIdentity.uuid);

      doc._cleanupObservers = () => {
        meta.unobserve(updateState);
        yPlayers.unobserve(updateState);
      };
    }, 500);

    return () => {
      if (doc._cleanupObservers) doc._cleanupObservers();
      webrtcProvider.destroy();
      doc.destroy();
    };
  }, [code, myIdentity]);

  useEffect(() => {
    if (!lastCard) return;
    const t = setTimeout(() => setLastCard(null), 4000);
    return () => clearTimeout(t);
  }, [lastCard]);

  const checkBankruptcy = useCallback((playerUuid, creditorUuid) => {
    if (!ydoc) return;
    const player = getPlayerById(ydoc, playerUuid);
    if (!player || player.cash >= 0) return;

    player.properties.forEach(propId => {
      setPropertyOwner(ydoc, propId, creditorUuid || null);
      removePropertyFromPlayer(ydoc, playerUuid, propId);
      if (creditorUuid) {
        addPropertyToPlayer(ydoc, creditorUuid, propId);
      }
    });

    eliminatePlayer(ydoc, playerUuid);

    const winner = checkWin(ydoc);
    if (winner) {
      ydoc.getMap('meta').set('phase', 'gameOver');
      setGameWinner(winner.name);
    }
  }, [ydoc]);

  const resolveLanding = useCallback((playerUuid, position, isDoubles) => {
    if (!ydoc) return;
    const space = BOARD_SPACES[position];
    const meta = ydoc.getMap('meta');

    switch (space.type) {
      case 'property':
      case 'railroad':
      case 'utility': {
        const propState = getPropertyState(ydoc, position);
        if (!propState.owner) {
          setPropertyModal({ isOpen: true, propertyId: position });
          meta.set('phase', 'buying');
        } else if (propState.owner !== playerUuid) {
          const rent = calculateRent(position, playerUuid, ydoc);
          if (rent > 0) {
            updatePlayerCash(ydoc, playerUuid, -rent);
            updatePlayerCash(ydoc, propState.owner, rent);
            const ownerName = getPlayerById(ydoc, propState.owner)?.name ?? 'owner';
            if (playerUuid === myPlayerId) toast(`Paid $${rent} rent to ${ownerName}`, 'warning');
          }
          setHasRolled(!isDoubles);
          meta.set('phase', 'rolling');
          checkBankruptcy(playerUuid, propState.owner);
        } else {
          setHasRolled(!isDoubles);
          meta.set('phase', 'rolling');
        }
        break;
      }

      case 'tax': {
        const taxAmount = space.amount || 0;
        updatePlayerCash(ydoc, playerUuid, -taxAmount);
        setHasRolled(!isDoubles);
        meta.set('phase', 'rolling');
        if (playerUuid === myPlayerId) toast(`Paid $${taxAmount} tax`, 'error');
        checkBankruptcy(playerUuid, null);
        break;
      }

      case 'chance': {
        const card = drawCard(ydoc, 'chance');
        setLastCard(card);
        const result = applyCardEffect(ydoc, card, playerUuid,
          ydoc.getArray('players').toArray().map(p => p.uuid));
        if (result.needsLandingResolution && result.newPosition !== null) {
          setTimeout(() => resolveLanding(playerUuid, result.newPosition, false), 800);
        } else {
          setHasRolled(!isDoubles);
          meta.set('phase', 'rolling');
        }
        break;
      }

      case 'communityChest': {
        const card = drawCard(ydoc, 'communityChest');
        setLastCard(card);
        const result = applyCardEffect(ydoc, card, playerUuid,
          ydoc.getArray('players').toArray().map(p => p.uuid));
        if (result.needsLandingResolution && result.newPosition !== null) {
          setTimeout(() => resolveLanding(playerUuid, result.newPosition, false), 800);
        } else {
          setHasRolled(!isDoubles);
          meta.set('phase', 'rolling');
        }
        break;
      }

      case 'goToJail': {
        sendToJail(ydoc, playerUuid);
        setHasRolled(false);
        meta.set('phase', 'rolling');
        if (playerUuid === myPlayerId) toast('Go directly to Jail!', 'error');
        break;
      }

      case 'go':
      case 'jail':
      case 'freeParking':
      default: {
        setHasRolled(!isDoubles);
        meta.set('phase', 'rolling');
        break;
      }
    }

    const winner = checkWin(ydoc);
    if (winner) {
      meta.set('phase', 'gameOver');
      setGameWinner(winner.name);
    }
  }, [ydoc, checkBankruptcy]);

  const handleRoll = useCallback(() => {
    if (!ydoc || isRolling) return;

    const meta = ydoc.getMap('meta');
    const currentIdx = meta.get('currentPlayer') ?? 0;
    const currentPlayer = ydoc.getArray('players').toArray()[currentIdx];

    if (!currentPlayer || currentPlayer.uuid !== myPlayerId) return;

    setIsRolling(true);

    setTimeout(() => {
      const { die1, die2, isDoubles, total, doublesCount: newDoublesCount } = rollDice(ydoc);
      setDice([die1, die2]);

      if (isDoubles && newDoublesCount >= 3) {
        sendToJail(ydoc, currentPlayer.uuid);
        meta.set('doublesCount', 0);
        meta.set('phase', 'rolling');
        setHasRolled(false);
        setIsRolling(false);
        return;
      }

      if (currentPlayer.inJail) {
        if (isDoubles) {
          escapeJail(ydoc, currentPlayer.uuid, 'doubles');
        } else {
          const yPlayers = ydoc.getArray('players');
          const arr = yPlayers.toArray();
          const idx = arr.findIndex(p => p.uuid === currentPlayer.uuid);
          if (idx !== -1) {
            const updatedPlayer = { ...arr[idx], jailTurns: arr[idx].jailTurns + 1 };
            yPlayers.delete(idx, 1);
            yPlayers.insert(idx, [updatedPlayer]);

            if (updatedPlayer.jailTurns >= 3) {
              escapeJail(ydoc, currentPlayer.uuid, 'pay');
            } else {
              meta.set('phase', 'rolling');
              setHasRolled(true);
              setIsRolling(false);
              return;
            }
          }
        }
      }

      const refreshedPlayer = ydoc.getArray('players').toArray().find(p => p.uuid === currentPlayer.uuid);
      const newPosition = (refreshedPlayer.position + total) % 40;
      movePlayer(ydoc, currentPlayer.uuid, newPosition);

      meta.set('phase', 'moving');
      setIsRolling(false);

      setTimeout(() => {
        resolveLanding(currentPlayer.uuid, newPosition, isDoubles);
      }, 600);
    }, 400);
  }, [ydoc, isRolling, myPlayerId, resolveLanding]);

  const handleBuy = useCallback(() => {
    if (!ydoc || propertyModal.propertyId == null) return;
    const result = buyProperty(ydoc, myPlayerId, propertyModal.propertyId);
    if (result.success) {
      const meta = ydoc.getMap('meta');
      meta.set('auctionPropertyId', undefined);
      setPropertyModal({ isOpen: false, propertyId: null });
      setHasRolled(true);
      meta.set('phase', 'rolling');
      const spaceName = BOARD_SPACES[propertyModal.propertyId]?.name;
      toast(`You bought ${spaceName}!`, 'success');
      setConfettiActive(true);
    }
  }, [ydoc, myPlayerId, propertyModal, toast]);

  const handleAuction = useCallback(() => {
    if (!ydoc || propertyModal.propertyId == null) return;
    const meta = ydoc.getMap('meta');
    const propId = propertyModal.propertyId;
    meta.set('auctionPropertyId', propId);
    meta.set('auctionBid', 0);
    meta.set('auctionHighBidder', null);
    meta.set('auctionPassed', []);
    setPropertyModal({ isOpen: false, propertyId: null });
    setHasRolled(true);
    meta.set('phase', 'auction');
  }, [ydoc, propertyModal]);

  const handleAuctionBid = useCallback((bidAmount) => {
    if (!ydoc || !auctionState) return;
    const meta = ydoc.getMap('meta');
    const currentBid = meta.get('auctionBid') ?? 0;
    if (bidAmount <= currentBid) return;
    meta.set('auctionBid', bidAmount);
    meta.set('auctionHighBidder', myPlayerId);
  }, [ydoc, auctionState, myPlayerId]);

  const handleAuctionPass = useCallback(() => {
    if (!ydoc || !auctionState) return;
    const meta = ydoc.getMap('meta');
    const passed = [...(meta.get('auctionPassed') ?? [])];
    if (!passed.includes(myPlayerId)) {
      passed.push(myPlayerId);
      meta.set('auctionPassed', passed);
    }

    const activePlayers = getActivePlayers(ydoc);
    const allPassed = activePlayers.every(p =>
      passed.includes(p.uuid) || p.uuid === meta.get('auctionHighBidder')
    );

    if (allPassed) {
      const highBidder = meta.get('auctionHighBidder');
      const bid = meta.get('auctionBid') ?? 0;
      const propId = meta.get('auctionPropertyId');

      if (highBidder && bid > 0 && propId != null) {
        updatePlayerCash(ydoc, highBidder, -bid);
        addPropertyToPlayer(ydoc, highBidder, propId);
        setPropertyOwner(ydoc, propId, highBidder);
      }

      meta.set('auctionPropertyId', undefined);
      meta.set('auctionBid', 0);
      meta.set('auctionHighBidder', null);
      meta.set('auctionPassed', []);
      meta.set('phase', 'rolling');
    }
  }, [ydoc, auctionState, myPlayerId]);

  const handleJailAction = useCallback((action) => {
    if (!ydoc) return;
    const meta = ydoc.getMap('meta');
    const currentIdx = meta.get('currentPlayer') ?? 0;
    const player = ydoc.getArray('players').toArray()[currentIdx];
    if (!player || player.uuid !== myPlayerId) return;

    if (action === 'pay') {
      escapeJail(ydoc, player.uuid, 'pay');
      meta.set('phase', 'rolling');
      setHasRolled(false);
    } else if (action === 'card') {
      if (player.getOutOfJailFree > 0) {
        const yPlayers = ydoc.getArray('players');
        const arr = yPlayers.toArray();
        const idx = arr.findIndex(p => p.uuid === player.uuid);
        if (idx !== -1) {
          const updated = { ...arr[idx], getOutOfJailFree: arr[idx].getOutOfJailFree - 1, inJail: false, jailTurns: 0 };
          yPlayers.delete(idx, 1);
          yPlayers.insert(idx, [updated]);
        }
        meta.set('phase', 'rolling');
        setHasRolled(false);
      }
    }
  }, [ydoc, myPlayerId]);

  const handleStartGame = useCallback(() => {
    if (!ydoc || !isHost) return;
    const meta = ydoc.getMap('meta');
    initCardDecks(ydoc);
    meta.set('phase', 'rolling');
    meta.set('currentPlayer', 0);
    meta.set('doublesCount', 0);
    meta.set('turnNumber', 1);
    setHasRolled(false);
  }, [ydoc, isHost]);

  const handleEndTurn = useCallback(() => {
    if (!ydoc) return;
    endTurn(ydoc);
    const meta = ydoc.getMap('meta');
    meta.set('phase', 'rolling');
    setHasRolled(false);

    const winner = checkWin(ydoc);
    if (winner) {
      meta.set('phase', 'gameOver');
      setGameWinner(winner.name);
    }
  }, [ydoc]);

  const handleProposeTrade = useCallback((tradeOffer) => {
    if (!ydoc) return;
    proposeTrade(ydoc, tradeOffer);
    setTradeModal({ isOpen: false, mode: 'propose', tradeOffer: null });
  }, [ydoc]);

  const handleAcceptTrade = useCallback((tradeId) => {
    if (!ydoc) return;
    acceptTrade(ydoc, tradeId);
    setTradeModal({ isOpen: false, mode: 'propose', tradeOffer: null });
  }, [ydoc]);

  const handleRejectTrade = useCallback((tradeId) => {
    if (!ydoc) return;
    rejectTrade(ydoc, tradeId);
    setTradeModal({ isOpen: false, mode: 'propose', tradeOffer: null });
  }, [ydoc]);

  const handleSaveConfig = useCallback((config) => {
    if (!ydoc || !isHost) return;
    const yConfig = ydoc.getMap('config');
    Object.entries(config).forEach(([k, v]) => yConfig.set(k, v));
  }, [ydoc, isHost]);

  const isMyTurn = players[currentPlayerIndex]?.uuid === myPlayerId;
  const currentPlayerObj = players[currentPlayerIndex];
  const currentPlayerInJail = currentPlayerObj?.inJail && currentPlayerObj?.uuid === myPlayerId;
  const canRoll = isMyTurn && !hasRolled && phase === 'rolling' && !propertyModal.isOpen;
  const canEndTurn = isMyTurn && hasRolled && phase === 'rolling' && !propertyModal.isOpen;
  const myPlayer = players.find(p => p.uuid === myPlayerId) ?? null;

  if (!code || !myIdentity) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        {!myIdentity ? (
          <div>
            <p style={{ color: '#2B2D42', marginBottom: '16px' }}>No identity found. Please set your name first.</p>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#E63946',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
              }}
            >
              Go to Lobby
            </button>
          </div>
        ) : (
          <p>Loading room...</p>
        )}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Room {code} - PoorDown</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <style>{`
        @media (max-width: 768px) {
          .game-grid { grid-template-columns: 1fr !important; height: auto !important; }
          .player-sidebar { height: auto !important; max-height: 50vh !important; }
          .board-container { max-height: 100vw !important; }
          .room-header { flex-direction: column !important; gap: 8px !important; }
          .room-header-players { display: none !important; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: '#F8F4E8', padding: '16px 20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '24px',
                fontWeight: '700',
                color: '#2B2D42',
                margin: 0,
              }}
            >
              Poor<span style={{ color: '#E63946' }}>Down</span>
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#2B2D42',
                borderRadius: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'white',
                  letterSpacing: '2px',
                }}
              >
                {code}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8D99AE',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
                title="Copy room link"
              >
                📋
              </button>
            </div>
          </div>

          <div className="room-header-players" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {players.map((player, idx) => (
              <div
                key={player.uuid}
                style={{
                  padding: '4px 12px',
                  backgroundColor: player.color,
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white',
                  fontFamily: 'Inter, sans-serif',
                  opacity: player.isEliminated ? 0.5 : 1,
                }}
              >
                {player.name} {idx === currentPlayerIndex && '🎯'}
              </div>
            ))}
          </div>
        </div>

        <div
          className="game-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 300px',
            gap: '20px',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Board players={players} currentPlayerIndex={currentPlayerIndex} />
            </motion.div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Dice
                dice={dice}
                rolling={isRolling}
                onRoll={handleRoll}
                disabled={!canRoll}
                isDoubles={dice[0] === dice[1] && dice[0] > 0}
              />
            </div>

            {currentPlayerInJail && phase === 'rolling' && !hasRolled && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#FFF3E0',
                  borderRadius: '16px',
                  border: '2px solid #F4A261',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#2B2D42', alignSelf: 'center' }}>
                  You are in Jail:
                </span>
                <motion.button
                  onClick={() => handleJailAction('pay')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#E63946',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  Pay $50
                </motion.button>
                {currentPlayerObj?.getOutOfJailFree > 0 && (
                  <motion.button
                    onClick={() => handleJailAction('card')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#2D6A4F',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                    }}
                  >
                    Use GOOJF Card
                  </motion.button>
                )}
                <motion.button
                  onClick={handleRoll}
                  disabled={isRolling}
                  whileHover={{ scale: isRolling ? 1 : 1.03 }}
                  whileTap={{ scale: isRolling ? 1 : 0.98 }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: isRolling ? '#8D99AE' : '#1D3557',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    cursor: isRolling ? 'not-allowed' : 'pointer',
                  }}
                >
                  Roll for Doubles
                </motion.button>
              </div>
            )}

            <AnimatePresence>
              {lastCard && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '16px 24px',
                    backgroundColor: lastCard.deck === 'chance' ? '#F4A261' : '#87CEEB',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#2B2D42',
                    fontStyle: 'italic',
                  }}
                >
                  <strong>{lastCard.deck === 'chance' ? 'Chance' : 'Community Chest'}</strong>
                  <br />
                  {lastCard.text}
                </motion.div>
              )}
            </AnimatePresence>

            <ActionBar
              phase={phase}
              canRoll={canRoll && !currentPlayerInJail}
              canBuy={propertyModal.isOpen && isMyTurn}
              canEndTurn={canEndTurn}
              onRoll={handleRoll}
              onBuy={handleBuy}
              onAuction={handleAuction}
              onEndTurn={handleEndTurn}
              onStartGame={handleStartGame}
              isHost={isHost}
              isMyTurn={isMyTurn}
              players={players}
            />
          </div>

          <div
            className="player-sidebar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
            }}
          >
            <h3
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '18px',
                fontWeight: '700',
                color: '#2B2D42',
                margin: 0,
                padding: '8px 0',
              }}
            >
              Players
            </h3>

            {players.map((player, idx) => (
              <PlayerHUD
                key={player.uuid}
                player={player}
                index={idx}
                isCurrentPlayer={idx === currentPlayerIndex}
                isMyPlayer={player.uuid === myPlayerId}
              />
            ))}

            <div
              style={{
                marginTop: 'auto',
                padding: '16px',
                backgroundColor: '#2B2D42',
                borderRadius: '12px',
                color: 'white',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <p style={{ margin: '0 0 8px 0', opacity: 0.7 }}>
                Phase: <strong>{phase}</strong>
              </p>
              <p style={{ margin: '0 0 4px 0', opacity: 0.7 }}>
                Room: <strong style={{ letterSpacing: '2px' }}>{code}</strong>
              </p>
              <p style={{ margin: 0, opacity: 0.7 }}>
                Playing as: <strong>{myIdentity.name}</strong>
              </p>
              {isHost && (
                <p style={{ margin: '4px 0 0 0', opacity: 0.7, color: '#F4A261' }}>
                  You are the host
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {phase !== 'setup' && phase !== 'connecting' && isMyTurn && myPlayer && !myPlayer.isEliminated && (
                <button
                  onClick={() => setTradeModal({ isOpen: true, mode: 'propose', tradeOffer: null })}
                  style={{ padding: '10px', backgroundColor: '#1D3557', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
                >
                  Trade
                </button>
              )}
              {myPlayer && myPlayer.properties.length > 0 && (
                <button
                  onClick={() => setPropertyMgmtModal(true)}
                  style={{ padding: '10px', backgroundColor: '#2D6A4F', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
                >
                  Manage Properties
                </button>
              )}
              {(isHost || phase === 'setup') && (
                <button
                  onClick={() => setConfigModal(true)}
                  style={{ padding: '10px', backgroundColor: '#8D99AE', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '600', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
                >
                  ⚙ Game Settings
                </button>
              )}
            </div>
          </div>
        </div>

        <PropertyModal
          isOpen={propertyModal.isOpen}
          onClose={() => {
            setPropertyModal({ isOpen: false, propertyId: null });
            setHasRolled(true);
            if (ydoc) ydoc.getMap('meta').set('phase', 'rolling');
          }}
          propertyId={propertyModal.propertyId}
          space={propertyModal.propertyId != null ? BOARD_SPACES[propertyModal.propertyId] : null}
          playerCash={players[currentPlayerIndex]?.cash || 0}
          onBuy={handleBuy}
          onAuction={handleAuction}
        />

        <AnimatePresence>
          {auctionState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(43, 45, 66, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 150,
              }}
            >
              <motion.div
                initial={{ scale: 0.85, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '32px',
                  maxWidth: '420px',
                  width: '90%',
                  textAlign: 'center',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#2B2D42',
                    margin: '0 0 8px 0',
                  }}
                >
                  Auction
                </h2>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    color: '#8D99AE',
                    margin: '0 0 16px 0',
                  }}
                >
                  {auctionState.propertyId != null ? BOARD_SPACES[auctionState.propertyId]?.name : ''}
                </p>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '36px',
                    fontWeight: '700',
                    color: '#228B22',
                    marginBottom: '8px',
                  }}
                >
                  ${auctionState.currentBid}
                </div>
                {auctionState.highBidder && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2B2D42', margin: '0 0 20px 0' }}>
                    High bid: {getPlayerById(ydoc, auctionState.highBidder)?.name ?? 'Unknown'}
                  </p>
                )}
                {isMyTurn && !auctionState.passed?.includes(myPlayerId) && (
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[10, 25, 50, 100].map(increment => (
                      <motion.button
                        key={increment}
                        onClick={() => handleAuctionBid(auctionState.currentBid + increment)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          padding: '10px 18px',
                          backgroundColor: '#2D6A4F',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: '600',
                          fontFamily: 'Inter, sans-serif',
                          cursor: 'pointer',
                        }}
                      >
                        +${increment}
                      </motion.button>
                    ))}
                    <motion.button
                      onClick={handleAuctionPass}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '10px 18px',
                        backgroundColor: '#E63946',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        fontFamily: 'Inter, sans-serif',
                        cursor: 'pointer',
                      }}
                    >
                      Pass
                    </motion.button>
                  </div>
                )}
                {!isMyTurn && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', margin: '16px 0 0 0' }}>
                    Waiting for other players to bid...
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <TradeModal
          isOpen={tradeModal.isOpen}
          onClose={() => setTradeModal({ isOpen: false, mode: 'propose', tradeOffer: null })}
          mode={tradeModal.mode}
          myPlayer={myPlayer}
          otherPlayer={tradeModal.mode === 'review' ? players.find(p => p.uuid === tradeModal.tradeOffer?.fromUuid) : null}
          ydoc={ydoc}
          onPropose={handleProposeTrade}
          onAccept={handleAcceptTrade}
          onReject={handleRejectTrade}
          tradeOffer={tradeModal.tradeOffer}
          allPlayers={players}
          boardSpaces={BOARD_SPACES}
        />

        <PropertyManagementModal
          isOpen={propertyMgmtModal}
          onClose={() => setPropertyMgmtModal(false)}
          playerUuid={myPlayerId}
          ydoc={ydoc}
          boardSpaces={BOARD_SPACES}
          groupColors={GROUP_COLORS}
          onBuildHouse={(propId) => { if (ydoc && myPlayerId && canBuildHouse(ydoc, myPlayerId, propId)) { const s = getPropertyState(ydoc, propId); setPropertyHouses(ydoc, propId, s.houses + 1); updatePlayerCash(ydoc, myPlayerId, -(BOARD_SPACES[propId]?.housePrice ?? 0)); } }}
          onSellHouse={(propId) => { if (ydoc && myPlayerId) { const s = getPropertyState(ydoc, propId); if (s.houses > 0) { setPropertyHouses(ydoc, propId, s.houses - 1); updatePlayerCash(ydoc, myPlayerId, Math.floor((BOARD_SPACES[propId]?.housePrice ?? 0) / 2)); } } }}
          onMortgage={(propId) => { if (ydoc && myPlayerId) mortgageProperty(ydoc, myPlayerId, propId); }}
          onUnmortgage={(propId) => { if (ydoc && myPlayerId) unmortgageProperty(ydoc, myPlayerId, propId); }}
        />

        <GameConfigModal
          isOpen={configModal}
          onClose={() => setConfigModal(false)}
          onSave={handleSaveConfig}
          isHost={isHost}
          currentConfig={ydoc ? Object.fromEntries(ydoc.getMap('config').entries()) : {}}
        />

        <Toast toasts={toasts} />
        <ReconnectBanner disconnectedPlayers={disconnectedPlayers} />
        <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

        <AnimatePresence>
          {phase === 'gameOver' && gameWinner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(43, 45, 66, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
              }}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '24px',
                  padding: '48px',
                  textAlign: 'center',
                  maxWidth: '400px',
                }}
              >
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
                <h2
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: '36px',
                    fontWeight: '800',
                    color: '#2B2D42',
                    margin: '0 0 8px 0',
                  }}
                >
                  {gameWinner} Wins!
                </h2>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    color: '#8D99AE',
                    margin: '0 0 32px 0',
                  }}
                >
                  Congratulations on your victory!
                </p>
                <button
                  onClick={() => router.push('/')}
                  style={{
                    padding: '14px 32px',
                    backgroundColor: '#2D6A4F',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  Play Again
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
