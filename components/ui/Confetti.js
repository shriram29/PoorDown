import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const COLORS = ['#E63946', '#F4A261', '#2D6A4F', '#1D3557', '#FFD700', '#FF69B4'];

const PIECES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  color: COLORS[i % COLORS.length],
  size: 6 + Math.random() * 8,
  delay: Math.random() * 0.5,
  rotation: Math.random() * 360,
  round: Math.random() > 0.5,
}));

export default function Confetti({ active, onComplete }) {
  useEffect(() => {
    if (active && onComplete) {
      const t = setTimeout(onComplete, 2500);
      return () => clearTimeout(t);
    }
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {active && PIECES.map(piece => (
        <motion.div
          key={piece.id}
          initial={{ opacity: 1, rotate: 0 }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 50 : 900,
            rotate: piece.rotation,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: piece.delay,
            ease: 'easeIn',
          }}
          style={{
            position: 'fixed',
            left: `${piece.x}%`,
            top: '-20px',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: piece.round ? '50%' : '2px',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        />
      ))}
    </AnimatePresence>
  );
}
