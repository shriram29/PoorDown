import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

export default function LudoRoom() {
  const router = useRouter();
  const { code } = router.query;

  return (
    <>
      <Head>
        <title>Ludo Room {code} - PoorDown</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8F4E8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '48px',
            textAlign: 'center',
            maxWidth: '440px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎲</div>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '32px',
              fontWeight: '800',
              color: '#2B2D42',
              margin: '0 0 12px 0',
            }}
          >
            Ludo
          </h1>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              color: '#8D99AE',
              margin: '0 0 8px 0',
            }}
          >
            Coming soon — we're building this.
          </p>
          {code && (
            <p
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                color: '#8D99AE',
                margin: '0 0 32px 0',
              }}
            >
              Room: {code}
            </p>
          )}
          <button
            onClick={() => router.push('/ludo')}
            style={{
              padding: '12px 28px',
              backgroundColor: '#E63946',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
            }}
          >
            Back to Lobby
          </button>
        </motion.div>
      </div>
    </>
  );
}