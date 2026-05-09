import { motion, AnimatePresence } from 'framer-motion';

const SPACES_TABLE = [
  ['Property / Railroad / Utility', 'Buy it, or pay rent if owned'],
  ['Chance / Community Chest', 'Draw a card'],
  ['Go', 'Collect $200'],
  ['Jail', 'Just visiting — no effect'],
  ['Go To Jail', 'Go directly to jail, do not collect $200'],
  ['Free Parking', 'Nothing happens'],
  ['Income Tax', 'Pay $200'],
  ['Luxury Tax', 'Pay $75'],
];

export default function HowToPlayModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(43, 45, 66, 0.85)',
              backdropFilter: 'blur(6px)',
              zIndex: 300,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflowY: 'auto',
              zIndex: 301,
              boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <h2
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#2B2D42',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                How to Play
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '22px',
                  color: '#8D99AE',
                  lineHeight: 1,
                  padding: '0 0 0 16px',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#2B2D42')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#8D99AE')}
              >
                ✕
              </button>
            </div>

            <Section title="The Basics">
              <RuleList items={[
                'Move around the board by rolling two dice',
                'Buy properties you land on; collect rent from others',
                'Build houses and hotels to increase rent',
                'Last player with money wins!',
              ]} />
            </Section>

            <Section title="Turn Flow">
              <ol style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8D99AE', lineHeight: '1.9', margin: 0, paddingLeft: '20px' }}>
                <li>Roll dice — rolling doubles lets you roll again</li>
                <li>Move your token the combined number of spaces</li>
                <li>Take action based on where you land</li>
                <li>End your turn</li>
              </ol>
            </Section>

            <Section title="Landing on Spaces">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8F4E8' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#2B2D42', fontWeight: '700', border: '1px solid #E8E4D8' }}>Space</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#2B2D42', fontWeight: '700', border: '1px solid #E8E4D8' }}>What happens</th>
                  </tr>
                </thead>
                <tbody>
                  {SPACES_TABLE.map(([space, action], i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#FAFAF8' }}>
                      <td style={{ padding: '8px 12px', color: '#2B2D42', fontWeight: '600', border: '1px solid #E8E4D8', whiteSpace: 'nowrap' }}>{space}</td>
                      <td style={{ padding: '8px 12px', color: '#8D99AE', border: '1px solid #E8E4D8' }}>{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Building Houses">
              <RuleList items={[
                'You must own all properties in a color group first',
                'Build evenly — you cannot build 2 on one property until all have 1',
                'Maximum 4 houses per property, then upgrade to a hotel',
                'Hotels dramatically increase rent',
              ]} />
            </Section>

            <Section title="Jail">
              <RuleList items={[
                'Pay a $50 fine before you roll',
                'Use a Get Out of Jail Free card',
                'Roll doubles on your turn',
                'After 3 turns: must pay $50 and move normally',
              ]} />
            </Section>

            <Section title="Bankruptcy" last>
              <RuleList items={[
                'If you cannot pay, sell houses and mortgage properties first',
                'If you still cannot pay, you are eliminated',
                'Your assets go to the creditor (bank or player)',
              ]} />
            </Section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : '28px' }}>
      <h3
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          fontWeight: '700',
          color: '#2B2D42',
          margin: '0 0 12px 0',
          paddingBottom: '6px',
          borderBottom: '2px solid #F8F4E8',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function RuleList({ items }) {
  return (
    <ul style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8D99AE', lineHeight: '1.9', margin: 0, paddingLeft: '20px' }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}
