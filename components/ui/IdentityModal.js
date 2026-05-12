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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(13, 13, 26, 0.9)',
            backdropFilter: 'blur(8px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{
              backgroundColor: '#1e1e38',
              borderRadius: '20px',
              padding: '40px',
              width: '100%',
              maxWidth: '460px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,128,252,0.2)',
              border: '1px solid rgba(139,128,252,0.15)',
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
                  color: '#ffffff',
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
                  color: '#8c80fc',
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
                  border: '2px solid rgba(139,128,252,0.2)',
                  fontSize: '18px',
                  fontFamily: 'Inter, sans-serif',
                  color: '#ffffff',
                  backgroundColor: '#16162a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4a4aff')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(139,128,252,0.2)')}
              />

              <div>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#8c80fc',
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
                          border: selected ? '2px solid #4a4aff' : '2px solid rgba(139,128,252,0.15)',
                          backgroundColor: selected ? 'rgba(74,74,255,0.15)' : '#16162a',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s, background-color 0.15s',
                          outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!selected) e.currentTarget.style.borderColor = 'rgba(139,128,252,0.4)';
                        }}
                        onMouseLeave={(e) => {
                          if (!selected) e.currentTarget.style.borderColor = 'rgba(139,128,252,0.15)';
                        }}
                      >
                        <span style={{ fontSize: '24px', lineHeight: 1 }}>{t.emoji}</span>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '10px',
                            color: selected ? '#8c80fc' : 'rgba(139,128,252,0.5)',
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
                  backgroundColor: isValid ? '#4a4aff' : 'rgba(139,128,252,0.2)',
                  color: isValid ? 'white' : 'rgba(139,128,252,0.5)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: '700',
                  fontFamily: 'Inter, sans-serif',
                  cursor: isValid ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s, transform 0.1s',
                  letterSpacing: '0.2px',
                  boxShadow: isValid ? '0 4px 20px rgba(74,74,255,0.4)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (isValid) e.target.style.backgroundColor = '#3a3aef';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = isValid ? '#4a4aff' : 'rgba(139,128,252,0.2)';
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
