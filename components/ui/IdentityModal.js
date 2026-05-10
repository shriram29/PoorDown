import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';

const TOKENS = [
  { id: 'hat',         label: 'Top Hat',      emoji: '🎩' },
  { id: 'car',         label: 'Race Car',     emoji: '🚗' },
  { id: 'dog',         label: 'Scottie Dog',  emoji: '🐶' },
  { id: 'iron',        label: 'Iron',         emoji: '🧲' },
  { id: 'ship',        label: 'Battleship',   emoji: '🚢' },
  { id: 'boot',        label: 'Boot',         emoji: '👟' },
  { id: 'thimble',     label: 'Thimble',      emoji: '🪡' },
  { id: 'wheelbarrow', label: 'Wheelbarrow',  emoji: '🛒' },
];

export default function IdentityModal({ isOpen, onComplete }) {
  const [name, setName] = useState('');
  const [token, setToken] = useState('hat');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') e.preventDefault();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const identity = { uuid: nanoid(21), name: trimmed, token };
    if (typeof window !== 'undefined') {
      localStorage.setItem('poordown_identity', JSON.stringify(identity));
    }
    onComplete(identity);
  };

  const isValid = name.trim().length > 0;
  const selectedToken = TOKENS.find((t) => t.id === token) || TOKENS[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(43, 45, 66, 0.85)',
              backdropFilter: 'blur(6px)',
              zIndex: 200,
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '40px',
              width: '100%',
              maxWidth: '460px',
              zIndex: 201,
              boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            }}
            onKeyDown={handleKeyDown}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>{selectedToken.emoji}</div>
              <h1
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#2B2D42',
                  margin: '0 0 10px 0',
                  lineHeight: 1.2,
                }}
              >
                What do we call you?
              </h1>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#8D99AE',
                  margin: 0,
                }}
              >
                Pick a name and token for this and future sessions.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Your name"
                maxLength={20}
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: '2px solid #E8E4D8',
                  fontSize: '18px',
                  fontFamily: 'Inter, sans-serif',
                  color: '#2B2D42',
                  backgroundColor: '#FAFAF8',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#E63946')}
                onBlur={(e) => (e.target.style.borderColor = '#E8E4D8')}
              />

              <div>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#2B2D42',
                    margin: '0 0 10px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Choose your token
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                  }}
                >
                  {TOKENS.map((t) => {
                    const selected = t.id === token;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setToken(t.id)}
                        title={t.label}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '10px 4px 8px',
                          borderRadius: '10px',
                          border: selected ? '2px solid #2D6A4F' : '2px solid #E8E4D8',
                          backgroundColor: selected ? '#EDF7F2' : '#FAFAF8',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s, background-color 0.15s',
                          outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!selected) e.currentTarget.style.borderColor = '#8D99AE';
                        }}
                        onMouseLeave={(e) => {
                          if (!selected) e.currentTarget.style.borderColor = '#E8E4D8';
                        }}
                      >
                        <span style={{ fontSize: '24px', lineHeight: 1 }}>{t.emoji}</span>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '10px',
                            color: selected ? '#2D6A4F' : '#8D99AE',
                            fontWeight: selected ? '700' : '400',
                            textAlign: 'center',
                            lineHeight: 1.2,
                          }}
                        >
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={!isValid}
                style={{
                  padding: '15px 24px',
                  backgroundColor: isValid ? '#E63946' : '#C8C4B8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: '700',
                  fontFamily: 'Inter, sans-serif',
                  cursor: isValid ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s, transform 0.1s',
                  letterSpacing: '0.2px',
                }}
                onMouseEnter={(e) => {
                  if (isValid) e.target.style.backgroundColor = '#CC2F3B';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = isValid ? '#E63946' : '#C8C4B8';
                }}
                onMouseDown={(e) => {
                  if (isValid) e.target.style.transform = 'scale(0.97)';
                }}
                onMouseUp={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                Let's Play!
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
