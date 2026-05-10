import { AnimatePresence, motion } from 'framer-motion';

const TYPE_COLORS = {
  info: '#1D3557',
  success: '#2D6A4F',
  warning: '#F4A261',
  error: '#E63946',
  card: '#F4A261',
};

function ToastItem({ toast }) {
  const bg = TYPE_COLORS[toast.type] ?? TYPE_COLORS.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        backgroundColor: bg,
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        padding: '12px 16px',
        borderRadius: '10px',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        pointerEvents: 'none',
      }}
    >
      {toast.message}
    </motion.div>
  );
}

export default function Toast({ toasts }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        zIndex: 500,
        maxWidth: '320px',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
