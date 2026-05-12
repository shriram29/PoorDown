import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import CreateRoom from '../../components/lobby/CreateRoom';
import JoinRoom from '../../components/lobby/JoinRoom';

export default function LudoLobby() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Ludo - PoorDown</title>
        <meta name="description" content="Play Ludo online with friends. Create or join a room." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0d0d1a',
          padding: '40px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,77,86,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#8c80fc',
              cursor: 'pointer',
              marginBottom: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8c80fc')}
          >
            ← All Games
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
            <img src="/assets/controller.svg" alt="" aria-hidden="true" style={{ width: 48, filter: 'drop-shadow(0 0 12px rgba(255,77,86,0.6))' }} />
            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '56px',
                fontWeight: '800',
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-1.5px',
              }}
            >
              Lu<span style={{ color: '#ff4d56' }}>do</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              color: '#8c80fc',
              margin: 0,
            }}
          >
            Race your tokens home first.
          </motion.p>
        </div>

        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            style={{
              backgroundColor: '#1e1e38',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(139,128,252,0.15)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img src="/assets/arcade.svg" alt="" aria-hidden="true" style={{ width: 48, marginBottom: '12px' }} />
              <h2
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: '0 0 6px 0',
                }}
              >
                Create a Room
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8c80fc', margin: 0 }}>
                Start a new game and invite friends
              </p>
            </div>
            <CreateRoom game="ludo" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
            style={{
              backgroundColor: '#1e1e38',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(139,128,252,0.15)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img src="/assets/vr.svg" alt="" aria-hidden="true" style={{ width: 48, marginBottom: '12px' }} />
              <h2
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: '0 0 6px 0',
                }}
              >
                Join a Room
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8c80fc', margin: 0 }}>
                Enter a room code to join
              </p>
            </div>
            <JoinRoom game="ludo" />
          </motion.div>
        </div>
      </div>
    </>
  );
}