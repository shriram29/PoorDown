import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import Board from '../../../components/games/monopoly/board/Board';
import Dice from '../../../components/games/monopoly/dice/Dice';
import PlayerHUD from '../../../components/games/monopoly/hud/PlayerHUD';
import ActionBar from '../../../components/games/monopoly/hud/ActionBar';
import PropertyModal from '../../../components/games/monopoly/modals/PropertyModal';
import TradeModal from '../../../components/games/monopoly/modals/TradeModal';
import PropertyManagementModal from '../../../components/games/monopoly/modals/PropertyManagementModal';
import GameConfigModal from '../../../components/games/monopoly/modals/GameConfigModal';
import SpaceDetailModal from '../../../components/games/monopoly/modals/SpaceDetailModal';
import { BOARD_SPACES, PLAYER_COLORS, GROUP_COLORS } from '../../../lib/games/monopoly/board';
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
} from '../../../lib/games/monopoly/state';
import { initCardDecks, drawCard, applyCardEffect } from '../../../lib/games/monopoly/cards';
import { useToast } from '../../../lib/useToast';
import Toast from '../../../components/ui/Toast';
import ReconnectBanner from '../../../components/ui/ReconnectBanner';
import Confetti from '../../../components/ui/Confetti';

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
  const [notFound, setNotFound] = useState(false);
  const [roomConfirmed, setRoomConfirmed] = useState(false);
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

    const hostFlag = new URLSearchParams(window.location.search).get('host') === 'true';
    const doc = new Y.Doc();
    const roomId = `poordown-${code}`;

    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || 'ws://localhost:4444';
    const webrtcProvider = new WebrtcProvider(roomId, doc, {
      signaling: [signalingUrl],
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
      const connected = Array.from(awareness.getStates().values())
        .map(s => s.player?.uuid)
        .filter(Boolean);

      if (connected.some(uuid => uuid !== myIdentity.uuid)) {
        setRoomConfirmed(true);
      }

      const meta = doc.getMap('meta');
      const hostId = meta.get('hostId');
      if (!hostId) return;

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

      if (hostFlag && !meta.get('hostId')) {
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
        const currentPhase = meta.get('phase') || (hostFlag ? 'setup' : 'connecting');
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

  useEffect(() => {
    if (phase !== 'connecting' || roomConfirmed) return;
    const t = setTimeout(() => setNotFound(true), 30000);
    return () => clearTimeout(t);
  }, [phase, roomConfirmed]);

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
      <div style={{ minHeight: '100vh', backgroundColor: '#16172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        {!myIdentity ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#7a7d9a', marginBottom: '16px', fontSize: '14px' }}>No identity found. Please set your name first.</p>
            <button
              onClick={() => router.push('/')}
              style={{ padding: '10px 22px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              Go to Lobby
            </button>
          </div>
        ) : (
          <p style={{ color: '#7a7d9a', fontSize: '14px' }}>Loading room…</p>
        )}
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#16172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '20px', fontWeight: '700', color: '#e2e2f0', margin: '0 0 8px' }}>
            Room not found
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#7a7d9a', margin: '0 0 24px', lineHeight: 1.6 }}>
            No one is hosting <span style={{ fontFamily: 'monospace', color: '#d0d0e8' }}>{code}</span>.<br />
            Check the code and try again.
          </p>
          <button
            onClick={() => router.push('/monopoly')}
            style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            ← Back to Monopoly
          </button>
        </div>
      </div>
    );
  }

  const divider = <div style={{ height: '1px', backgroundColor: '#2e305a', margin: '0' }} />;
  const sectionLabel = (text) => (
    <div style={{ padding: '8px 14px 4px', fontSize: '10px', color: '#4a4d6a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Inter, sans-serif' }}>
      {text}
    </div>
  );

  return (
    <>
      <Head>
        <title>Room {code} — PoorDown</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #16172a; }
        @media (max-width: 768px) {
          .main-layout { flex-direction: column !important; }
          .right-panel { width: 100% !important; height: auto !important; border-left: none !important; border-top: 1px solid #2e305a !important; }
          .board-area { flex: none !important; height: 100vw !important; }
        }
      `}</style>

      {/* Root */}
      <div style={{ minHeight: '100vh', backgroundColor: '#16172a', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

        {/* Top bar */}
        <div style={{ height: '44px', backgroundColor: '#1e2038', borderBottom: '1px solid #2e305a', display: 'flex', alignItems: 'center', padding: '0 14px', gap: '12px', flexShrink: 0 }}>
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#e2e2f0', letterSpacing: '-0.3px' }}>
            Poor<span style={{ color: '#ef4444' }}>Down</span>
          </span>
          <span style={{ fontSize: '11px', color: '#3a3d5c', fontWeight: '500' }}>Monopoly</span>
          <div style={{ flex: 1 }} />
          {isHost && (
            <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Host</span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#252645', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
               onClick={() => navigator.clipboard.writeText(window.location.origin + window.location.pathname)}>
            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#d0d0e8', letterSpacing: '2px' }}>{code}</span>
            <span style={{ fontSize: '11px', color: '#4a4d6a' }}>copy</span>
          </div>
        </div>

        {/* Main layout */}
        <div className="main-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* Board area */}
          <div className="board-area" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              style={{ height: 'min(calc(100vh - 68px), 100%)', aspectRatio: '1 / 1', maxWidth: '100%' }}
            >
              <Board
                players={players}
                currentPlayerIndex={currentPlayerIndex}
                onPropertyClick={(spaceId) => setSpaceDetailModal({ isOpen: true, spaceId })}
              />
            </motion.div>
          </div>

          {/* Right panel */}
          <div className="right-panel" style={{ width: '272px', borderLeft: '1px solid #2e305a', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

            {/* Players */}
            {sectionLabel(`Players (${players.length})`)}
            <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
              {players.map((player, idx) => (
                <PlayerHUD
                  key={player.uuid}
                  player={player}
                  index={idx}
                  isCurrentPlayer={idx === currentPlayerIndex}
                  isMyPlayer={player.uuid === myPlayerId}
                />
              ))}
            </div>

            {divider}

            {/* Dice */}
            <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'center' }}>
              <Dice
                dice={dice}
                rolling={isRolling}
                onRoll={handleRoll}
                disabled={!canRoll}
                isDoubles={dice[0] === dice[1] && dice[0] > 0}
              />
            </div>

            {/* Actions */}
            <div style={{ padding: '0 14px 12px' }}>
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

              {/* Jail options */}
              {currentPlayerInJail && phase === 'rolling' && !hasRolled && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>You are in Jail</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button onClick={() => handleJailAction('pay')} style={jailBtnStyle('#ef4444')}>Pay $50</button>
                    {currentPlayerObj?.getOutOfJailFree > 0 && (
                      <button onClick={() => handleJailAction('card')} style={jailBtnStyle('#22c55e')}>Use Card</button>
                    )}
                    <button onClick={handleRoll} disabled={isRolling} style={jailBtnStyle('#6366f1')}>Roll Doubles</button>
                  </div>
                </div>
              )}

              {/* Card drawn */}
              <AnimatePresence>
                {lastCard && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      marginTop: '8px',
                      padding: '10px 12px',
                      backgroundColor: lastCard.deck === 'chance' ? '#2d1f00' : '#0d1a2d',
                      borderLeft: `3px solid ${lastCard.deck === 'chance' ? '#f59e0b' : '#6366f1'}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#d0d0e8',
                      fontStyle: 'italic',
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ fontSize: '10px', fontWeight: '700', color: lastCard.deck === 'chance' ? '#f59e0b' : '#818cf8', marginBottom: '3px', fontStyle: 'normal' }}>
                      {lastCard.deck === 'chance' ? 'CHANCE' : 'COMMUNITY CHEST'}
                    </div>
                    {lastCard.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {divider}

            {/* My Properties */}
            {myPlayer?.properties?.length > 0 && (
              <>
                {sectionLabel(`My Properties (${myPlayer.properties.length})`)}
                <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '4px' }}>
                  {myPlayer.properties.map(propId => {
                    const space = BOARD_SPACES[propId];
                    const color = GROUP_COLORS[space?.group] || '#6a6d9a';
                    return (
                      <div key={propId} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 14px', cursor: 'pointer' }}
                           onClick={() => setSpaceDetailModal({ isOpen: true, spaceId: propId })}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: '12px', color: '#a0a3bc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{space?.name}</span>
                      </div>
                    );
                  })}
                </div>
                {divider}
              </>
            )}

            {/* Bottom controls */}
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
              {phase !== 'setup' && phase !== 'connecting' && isMyTurn && myPlayer && !myPlayer.isEliminated && (
                <button onClick={() => setTradeModal({ isOpen: true, mode: 'propose', tradeOffer: null })} style={ctrlBtnStyle('#3730a3')}>
                  Trade
                </button>
              )}
              {myPlayer?.properties?.length > 0 && (
                <button onClick={() => setPropertyMgmtModal(true)} style={ctrlBtnStyle('#166534')}>
                  Manage Properties
                </button>
              )}
              {(isHost || phase === 'setup') && (
                <button onClick={() => setConfigModal(true)} style={ctrlBtnStyle('#1e2038', '#4a4d6a')}>
                  Settings
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PropertyModal
        isOpen={propertyModal.isOpen}
        onClose={() => { setPropertyModal({ isOpen: false, propertyId: null }); setHasRolled(true); if (ydoc) ydoc.getMap('meta').set('phase', 'rolling'); }}
        propertyId={propertyModal.propertyId}
        space={propertyModal.propertyId != null ? BOARD_SPACES[propertyModal.propertyId] : null}
        playerCash={players[currentPlayerIndex]?.cash || 0}
        onBuy={handleBuy}
        onAuction={handleAuction}
      />

      <AnimatePresence>
        {auctionState && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10,10,20,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 16 }} animate={{ scale: 1, y: 0 }}
              style={{ backgroundColor: '#1e2038', border: '1px solid #2e305a', borderRadius: '16px', padding: '28px', maxWidth: '380px', width: '90%', textAlign: 'center' }}
            >
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: '700', color: '#e2e2f0', margin: '0 0 4px' }}>Auction</h2>
              <p style={{ fontSize: '13px', color: '#7a7d9a', margin: '0 0 16px' }}>
                {auctionState.propertyId != null ? BOARD_SPACES[auctionState.propertyId]?.name : ''}
              </p>
              <div style={{ fontFamily: 'monospace', fontSize: '32px', fontWeight: '700', color: '#4ade80', marginBottom: '6px' }}>
                ${auctionState.currentBid}
              </div>
              {auctionState.highBidder && (
                <p style={{ fontSize: '12px', color: '#7a7d9a', margin: '0 0 16px' }}>
                  Leading: {getPlayerById(ydoc, auctionState.highBidder)?.name ?? 'Unknown'}
                </p>
              )}
              {!auctionState.passed?.includes(myPlayerId) && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[10, 25, 50, 100].map(inc => (
                    <motion.button key={inc} onClick={() => handleAuctionBid(auctionState.currentBid + inc)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      style={{ padding: '8px 14px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                      +${inc}
                    </motion.button>
                  ))}
                  <motion.button onClick={handleAuctionPass}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    style={{ padding: '8px 14px', backgroundColor: '#7f1d1d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                    Pass
                  </motion.button>
                </div>
              )}
              {auctionState.passed?.includes(myPlayerId) && (
                <p style={{ fontSize: '12px', color: '#4a4d6a', margin: '8px 0 0' }}>You passed. Waiting for others…</p>
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

      <SpaceDetailModal
        isOpen={spaceDetailModal.isOpen}
        onClose={() => setSpaceDetailModal({ isOpen: false, spaceId: null })}
        spaceId={spaceDetailModal.spaceId}
        ydoc={ydoc}
        myPlayerId={myPlayerId}
      />

      <Toast toasts={toasts} />
      <ReconnectBanner disconnectedPlayers={disconnectedPlayers} />
      <Confetti active={confettiActive} onComplete={() => setConfettiActive(false)} />

      <AnimatePresence>
        {phase === 'gameOver' && gameWinner && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10,10,20,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 16 }} animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22 }}
              style={{ backgroundColor: '#1e2038', border: '1px solid #2e305a', borderRadius: '20px', padding: '40px', textAlign: 'center', maxWidth: '360px' }}
            >
              <div style={{ fontSize: '56px', marginBottom: '14px' }}>🏆</div>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: '800', color: '#e2e2f0', margin: '0 0 6px' }}>
                {gameWinner} Wins!
              </h2>
              <p style={{ fontSize: '13px', color: '#7a7d9a', margin: '0 0 28px' }}>
                Congratulations on your victory!
              </p>
              <button
                onClick={() => router.push('/monopoly')}
                style={{ padding: '10px 28px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function jailBtnStyle(bg) {
  return { padding: '6px 12px', backgroundColor: bg, color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', fontFamily: 'Inter, sans-serif', cursor: 'pointer' };
}

function ctrlBtnStyle(bg, color = 'white') {
  return { padding: '7px 12px', backgroundColor: bg, color, border: '1px solid #2e305a', borderRadius: '7px', fontSize: '12px', fontWeight: '600', fontFamily: 'Inter, sans-serif', cursor: 'pointer', textAlign: 'left' };
}
