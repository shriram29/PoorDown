// Property Purchase Modal
import { motion } from 'framer-motion';
import Modal from '../../../ui/Modal';
import { BOARD_SPACES, GROUP_COLORS } from '../../../../lib/games/monopoly/board';

export default function PropertyModal({
  isOpen,
  onClose,
  propertyId,
  space,
  playerCash,
  onBuy,
  onAuction,
  loading = false,
}) {
  if (!space) return null;

  const groupColor = GROUP_COLORS[space.group] || '#8D99AE';
  const canAfford = playerCash >= space.price;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={space.name}>
      {/* Property color banner */}
      <div
        style={{
          height: '8px',
          backgroundColor: groupColor,
          borderRadius: '4px',
          marginBottom: '16px',
        }}
      />

      {/* Price */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '36px',
            fontWeight: '700',
            color: canAfford ? '#228B22' : '#E63946',
          }}
        >
          ${space.price}
        </div>
        <div style={{ fontSize: '12px', color: '#8D99AE', fontFamily: 'Inter, sans-serif' }}>
          Your cash: ${playerCash?.toLocaleString()}
        </div>
      </div>

      {/* Rent table */}
      {space.rent && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#2B2D42' }}>
            Rent Schedule
          </h4>
          <div
            style={{
              backgroundColor: '#E8E4D8',
              borderRadius: '8px',
              padding: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#2B2D42' }}>Base Rent</span>
              <span style={{ color: '#E63946', fontWeight: '600' }}>${space.rent[0]}</span>
            </div>
            {space.housePrice && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#2B2D42' }}>With 1 House</span>
                  <span style={{ color: '#E63946' }}>${space.rent[1]}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#2B2D42' }}>With 2 Houses</span>
                  <span style={{ color: '#E63946' }}>${space.rent[2]}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#2B2D42' }}>With 3 Houses</span>
                  <span style={{ color: '#E63946' }}>${space.rent[3]}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#2B2D42' }}>With 4 Houses</span>
                  <span style={{ color: '#E63946' }}>${space.rent[4]}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#2B2D42' }}>With Hotel</span>
                  <span style={{ color: '#E63946', fontWeight: '600' }}>${space.rent[5]}</span>
                </div>
                <div
                  style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #D0CCC0',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ color: '#8D99AE' }}>House cost</span>
                  <span style={{ color: '#8D99AE' }}>${space.housePrice} each</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Railroad info */}
      {space.type === 'railroad' && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#2B2D42', margin: '0 0 8px 0' }}>
            🚂 Railroads owned: increases rent
          </p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#8D99AE', margin: 0 }}>
            1 railroad: $25 | 2 railroads: $50 | 3 railroads: $100 | 4 railroads: $200
          </p>
        </div>
      )}

      {/* Utility info */}
      {space.type === 'utility' && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#2B2D42', margin: '0 0 8px 0' }}>
            ⚡ Rent based on dice roll
          </p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#8D99AE', margin: 0 }}>
            1 utility: 4× dice | 2 utilities: 10× dice
          </p>
        </div>
      )}

      {/* Cannot afford warning */}
      {!canAfford && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#FEE2E2',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '2px solid #E63946',
          }}
        >
          <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#E63946', textAlign: 'center' }}>
            ⚠️ You cannot afford this property!
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        {canAfford && (
          <motion.button
            onClick={onBuy}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '12px 32px',
              backgroundColor: '#2D6A4F',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1,
            }}
          >
            🏠 Buy Property
          </motion.button>
        )}

        {onAuction && (
          <motion.button
            onClick={onAuction}
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '12px 32px',
              backgroundColor: '#1D3557',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            🔨 Auction
          </motion.button>
        )}

        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '12px 32px',
            backgroundColor: '#E8E4D8',
            color: '#2B2D42',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          Pass
        </motion.button>
      </div>
    </Modal>
  );
}
