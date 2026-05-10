// Generic Modal component
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(43, 45, 66, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
            }}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#F8F4E8',
              borderRadius: '16px',
              padding: '24px',
              minWidth: '320px',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
              zIndex: 101,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #E8E4D8',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#2B2D42',
                }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#E8E4D8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#2B2D42',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#DDD8C8'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#E8E4D8'}
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}