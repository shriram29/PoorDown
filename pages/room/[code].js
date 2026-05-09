// Game Room page - /room/[code]
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import * as Y from 'yjs';
import { nanoid } from 'nanoid';
import Board from '../../components/board/Board';
import Dice from '../../components/dice/Dice';
import PlayerHUD from '../../components/hud/PlayerHUD';
import ActionBar from '../../components/hud/ActionBar';
import PropertyModal from '../../components/modals/PropertyModal';
import { BOARD_SPACES, PLAYER_COLORS, DEFAULT_CONFIG } from '../../lib/game/board';
import {
  initGame,
  addPlayer,
  getPlayers,
  getPlayerById,
  rollDice as rollDiceState,
  movePlayer,
  buyProperty,
  endTurn,
  setPhase,
  setCurrentPlayer,
  getSpace,
  getPropertyState,
  calculateRent,
  addPropertyToPlayer,
  updatePlayerCash,
  setPropertyOwner,
  getActivePlayers,
  checkWin,
  sendToJail,
  escapeJail,
  ownsColorSet,
  canBuildHouse,
  setPropertyHouses,
} from '../../lib/game/state';

export default function GameRoom() {
  const router = useRouter();
  const { code, name, host } = router.query;
  
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [players, setPlayers] = useState([]);
  const [phase, setPhaseState] = useState('connecting');
  const [dice, setDice] = useState([0, 0]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [isHost, setIsHostState] = useState(false);
  const [propertyModal, setPropertyModal] = useState({ isOpen: false, propertyId: null });
  const [landingSpace, setLandingSpace] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [doublesCount, setDoublesCount] = useState(0);

  // Initialize game
  useEffect(() => {
    if (!code || !name) return;

    const isHostPlayer = host === 'true';
    const playerId = nanoid();
    
    // Initialize Y.js
    const doc = new Y.Doc();
    const roomId = `poordown-${code}`;
    
    // For MVP, we'll use a simple in-memory approach
    // In production, this would connect to PartyKit
    
    // Set up shared types
    const yPlayers = doc.getArray('players');
    const yPhase = doc.getText('phase');
    const yDice = doc.getArray('dice');
    const yCurrentPlayer = doc.getNumber('currentPlayer');
    const yDoublesCount = doc.getNumber('doublesCount');
    
    // Initialize phase if new room
    if (yPhase.length === 0) {
      yPhase.insert(0, 'setup');
    }
    
    // Add player
    const colorIndex = yPlayers.length % PLAYER_COLORS.length;
    const player = {
      id: playerId,
      name: decodeURIComponent(name),
      color: PLAYER_COLORS[colorIndex],
      cash: DEFAULT_CONFIG.startingCash,
      position: 0,
      properties: [],
      inJail: false,
      jailTurns: 0,
      getOutOfJailFree: false,
      isBot: false,
      isEliminated: false,
    };
    
    yPlayers.push([player]);
    
    setYdoc(doc);
    setMyPlayerId(playerId);
    setIsHostState(isHostPlayer);
    
    // Listen for changes
    const updatePlayers = () => {
      setPlayers([...yPlayers.toArray()]);
    };
    
    const updatePhase = () => {
      setPhaseState(yPhase.toString() || 'setup');
    };
    
    const updateDice = () => {
      setDice([...yDice.toArray()]);
    };
    
    const updateCurrentPlayer = () => {
      setCurrentPlayerIndex(doc.getNumber('currentPlayer') || 0);
    };
    
    const updateDoubles = () => {
      setDoublesCount(doc.getNumber('doublesCount') || 0);
    };
    
    yPlayers.observe(updatePlayers);
    yPhase.observe(updatePhase);
    yDice.observe(updateDice);
    
    // Update current player observable
    const n = doc.getNumber('currentPlayer');
    if (n._observers) n._observers.push(updateCurrentPlayer);
    
    updatePlayers();
    updatePhase();
    
    // For MVP, simulate a WebSocket connection with local state
    // In production, this would use PartyKit
    
    return () => {
      yPlayers.unobserve(updatePlayers);
      yPhase.unobserve(updatePhase);
    };
  }, [code, name, host]);

  // Handle roll dice
  const handleRoll = useCallback(() => {
    if (!ydoc || isRolling) return;
    
    setIsRolling(true);
    
    setTimeout(() => {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const isDoubles = die1 === die2;
      
      const yDice = ydoc.getArray('dice');
      const yDoublesCount = ydoc.getNumber('doublesCount') || 0;
      const yCurrentPlayer = ydoc.getNumber('currentPlayer') || 0;
      
      // Clear and set new dice
      while (yDice.length > 0) yDice.delete(0);
      yDice.push([die1, die2]);
      
      // Get current player
      const currentPlayers = ydoc.getArray('players').toArray();
      const currentPlayer = currentPlayers[yCurrentPlayer];
      
      if (!currentPlayer) {
        setIsRolling(false);
        return;
      }
      
      // Check for doubles and jail
      if (isDoubles && doublesCount >= 2) {
        // Third doubles - go to jail
        sendToJail(ydoc, currentPlayer.id);
        setDoublesCount(0);
        setIsRolling(false);
        setPhaseState('rolling');
        return;
      }
      
      let newDoublesCount = isDoubles ? doublesCount + 1 : 0;
      
      if (isDoubles) {
        setDoublesCount(newDoublesCount);
      } else {
        setDoublesCount(0);
      }
      
      // Move player
      const newPosition = (currentPlayer.position + die1 + die2) % 40;
      
      // Handle passing Go
      let cashBonus = 0;
      if (newPosition < currentPlayer.position && !currentPlayer.inJail) {
        cashBonus = 200;
      }
      
      // Update position
      const yPlayers = ydoc.getArray('players');
      const playersArr = yPlayers.toArray();
      const idx = playersArr.findIndex(p => p.id === currentPlayer.id);
      
      if (idx !== -1) {
        const updatedPlayer = { 
          ...playersArr[idx], 
          position: newPosition,
          cash: playersArr[idx].cash + cashBonus 
        };
        yPlayers.delete(idx, 1);
        yPlayers.insert(idx, [updatedPlayer]);
      }
      
      // Update state
      setDice([die1, die2]);
      setPhaseState('moving');
      setIsRolling(false);
      
      // Show property modal after movement
      setTimeout(() => {
        const space = BOARD_SPACES[newPosition];
        if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
          const propertyState = getPropertyState(ydoc, newPosition);
          if (!propertyState.owner) {
            setPropertyModal({ isOpen: true, propertyId: newPosition });
          } else {
            // Landed on owned property - pay rent
            const owner = getPlayerById(ydoc, propertyState.owner);
            if (owner && owner.id !== currentPlayer.id) {
              const rent = calculateRent(newPosition, currentPlayer.id, ydoc);
              if (rent > 0) {
                // Deduct rent
                const playerIdx = playersArr.findIndex(p => p.id === currentPlayer.id);
                const ownerIdx = playersArr.findIndex(p => p.id === owner.id);
                
                if (playerIdx !== -1 && ownerIdx !== -1) {
                  const updatedPlayer2 = { ...playersArr[playerIdx], cash: playersArr[playerIdx].cash - rent };
                  const updatedOwner = { ...playersArr[ownerIdx], cash: playersArr[ownerIdx].cash + rent };
                  
                  yPlayers.delete(playerIdx, 1);
                  yPlayers.insert(playerIdx, [updatedPlayer2]);
                  yPlayers.delete(ownerIdx, 1);
                  yPlayers.insert(ownerIdx, [updatedOwner]);
                }
              }
            }
            setPhaseState('rolling');
          }
        } else {
          setPhaseState('rolling');
        }
      }, 500);
    }, 400);
  }, [ydoc, isRolling, doublesCount, players]);

  // Handle buy property
  const handleBuy = useCallback(() => {
    if (!ydoc || !propertyModal.propertyId) return;
    
    const yPlayers = ydoc.getArray('players');
    const playersArr = yPlayers.toArray();
    const currentPlayer = playersArr[currentPlayerIndex];
    
    if (!currentPlayer) return;
    
    const space = BOARD_SPACES[propertyModal.propertyId];
    if (!space || !space.price) return;
    
    if (currentPlayer.cash < space.price) return;
    
    // Update player cash
    const idx = playersArr.findIndex(p => p.id === currentPlayer.id);
    if (idx !== -1) {
      const updatedPlayer = { 
        ...playersArr[idx], 
        cash: playersArr[idx].cash - space.price,
        properties: [...playersArr[idx].properties, propertyModal.propertyId]
      };
      yPlayers.delete(idx, 1);
      yPlayers.insert(idx, [updatedPlayer]);
    }
    
    // Update property ownership
    const yBoard = ydoc.getMap('board');
    yBoard.set(propertyModal.propertyId.toString(), { owner: currentPlayer.id, houses: 0, mortgaged: false });
    
    setPropertyModal({ isOpen: false, propertyId: null });
    setPhaseState('rolling');
  }, [ydoc, propertyModal, currentPlayerIndex]);

  // Handle end turn
  const handleEndTurn = useCallback(() => {
    if (!ydoc) return;
    
    const yCurrentPlayer = ydoc.getNumber('currentPlayer') || 0;
    const yPlayers = ydoc.getArray('players');
    const playersArr = yPlayers.toArray();
    
    // Find next active player
    let next = (yCurrentPlayer + 1) % playersArr.length;
    let attempts = 0;
    while (playersArr[next]?.isEliminated && attempts < playersArr.length) {
      next = (next + 1) % playersArr.length;
      attempts++;
    }
    
    // Update current player
    ydoc.getNumber('currentPlayer', next);
    setCurrentPlayerIndex(next);
    setDoublesCount(0);
    
    // Check win condition
    const activePlayers = getActivePlayers(ydoc);
    if (activePlayers.length === 1) {
      setPhaseState('gameOver');
      setGameWinner(activePlayers[0].name);
      return;
    }
    
    // Check if new player is in jail
    const nextPlayer = playersArr[next];
    if (nextPlayer?.inJail) {
      // In jail - will need to roll or pay
    }
    
    setPhaseState('rolling');
  }, [ydoc]);

  // Handle start game
  const handleStartGame = useCallback(() => {
    if (!ydoc || !isHost) return;
    
    const yPhase = ydoc.getText('phase');
    yPhase.delete(0, yPhase.length);
    yPhase.insert(0, 'rolling');
    
    ydoc.getNumber('currentPlayer', 0);
    ydoc.getNumber('doublesCount', 0);
    
    setPhaseState('rolling');
    setCurrentPlayerIndex(0);
  }, [ydoc, isHost]);

  // Check if it's current player's turn
  const isMyTurn = players[currentPlayerIndex]?.id === myPlayerId;
  const currentSpace = players[currentPlayerIndex]?.position;
  
  // Get landing space info
  const landingSpaceInfo = landingSpace ? BOARD_SPACES[landingSpace] : null;

  if (!code || !name) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <p>Loading room...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Room {code} - PoorDown</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8F4E8',
          padding: '20px',
        }}
      >
        {/* Header */}
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
                fontFamily: 'Playfair Display, serif',
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
          
          {/* Players */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {players.map((player, idx) => (
              <div
                key={player.id}
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

        {/* Main game area */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 300px',
            gap: '20px',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          {/* Left: Board + Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Board */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Board
                players={players}
                currentPlayerIndex={currentPlayerIndex}
              />
            </motion.div>
            
            {/* Dice */}
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
                disabled={!isMyTurn || phase !== 'rolling'}
                isDoubles={dice[0] === dice[1] && dice[0] > 0}
              />
            </div>
            
            {/* Action Bar */}
            <ActionBar
              phase={phase}
              canRoll={isMyTurn && phase === 'rolling'}
              canBuy={propertyModal.isOpen}
              canEndTurn={isMyTurn && (phase === 'rolling' || phase === 'moving')}
              onRoll={handleRoll}
              onBuy={handleBuy}
              onAuction={() => setPropertyModal({ isOpen: false, propertyId: null })}
              onEndTurn={handleEndTurn}
              onStartGame={handleStartGame}
              isHost={isHost}
              isMyTurn={isMyTurn}
              players={players}
            />
          </div>
          
          {/* Right: Player HUDs */}
          <div
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
                fontFamily: 'Playfair Display, serif',
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
                key={player.id}
                player={player}
                index={idx}
                isCurrentPlayer={idx === currentPlayerIndex}
                isMyPlayer={player.id === myPlayerId}
              />
            ))}
            
            {/* Game info */}
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
              <p style={{ margin: 0, opacity: 0.7 }}>
                Room code: <strong style={{ letterSpacing: '2px' }}>{code}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Property Purchase Modal */}
        <PropertyModal
          isOpen={propertyModal.isOpen}
          onClose={() => {
            setPropertyModal({ isOpen: false, propertyId: null });
            setPhaseState('rolling');
          }}
          propertyId={propertyModal.propertyId}
          space={propertyModal.propertyId !== null ? BOARD_SPACES[propertyModal.propertyId] : null}
          playerCash={players[currentPlayerIndex]?.cash || 0}
          onBuy={handleBuy}
          onAuction={() => setPropertyModal({ isOpen: false, propertyId: null })}
        />

        {/* Game Over Modal */}
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
                    fontFamily: 'Playfair Display, serif',
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