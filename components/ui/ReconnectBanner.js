import { AnimatePresence, motion } from 'framer-motion';

export default function ReconnectBanner({ disconnectedPlayers }) {
  return (
    <AnimatePresence>
      {disconnectedPlayers.length > 0 && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#8D99AE',
            color: 'white',
            textAlign: 'center',
            padding: '8px 16px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            zIndex: 1000,
          }}
        >
          ⚠ {disconnectedPlayers.join(', ')} {disconnectedPlayers.length === 1 ? 'has' : 'have'} disconnected
        </motion.div>
      )}
    </AnimatePresence>
  );
}
