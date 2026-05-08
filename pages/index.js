// Home / Lobby page
import Head from 'next/head';
import { motion } from 'framer-motion';
import CreateRoom from '../components/lobby/CreateRoom';
import JoinRoom from '../components/lobby/JoinRoom';

export default function Home() {
  return (
    <>
      <Head>
        <title>RichDown - Online Monopoly Clone</title>
        <meta name="description" content="The board game you know, anywhere you are. Play multiplayer Monopoly online with friends." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8F4E8',
          padding: '40px 20px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '64px',
              fontWeight: '800',
              color: '#2B2D42',
              margin: '0 0 16px 0',
              letterSpacing: '-2px',
            }}
          >
            Rich<span style={{ color: '#E63946' }}>Down</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              color: '#8D99AE',
              margin: 0,
            }}
          >
            The board game you know, anywhere you are.
          </motion.p>
        </div>

        {/* Main content */}
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
          }}
        >
          {/* Create Room */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '48px' }}>🎮</span>
              <h2
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#2B2D42',
                  margin: '16px 0 8px 0',
                }}
              >
                Create a Room
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#8D99AE',
                  margin: 0,
                }}
              >
                Start a new game and invite your friends
              </p>
            </div>
            <CreateRoom />
          </motion.div>

          {/* Join Room */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '48px' }}>🚀</span>
              <h2
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#2B2D42',
                  margin: '16px 0 8px 0',
                }}
              >
                Join a Room
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#8D99AE',
                  margin: 0,
                }}
              >
                Enter a room code to join an existing game
              </p>
            </div>
            <JoinRoom />
          </motion.div>
        </div>

        {/* How to Play */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            maxWidth: '600px',
            margin: '60px auto 0',
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px 32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <h3
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '22px',
              fontWeight: '700',
              color: '#2B2D42',
              margin: '0 0 16px 0',
              textAlign: 'center',
            }}
          >
            📖 How to Play
          </h3>
          <ol
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#2B2D42',
              lineHeight: '1.8',
              paddingLeft: '20px',
              margin: 0,
            }}
          >
            <li>Create a room or join one with a 6-character code</li>
            <li>Share the code with friends so they can join</li>
            <li>Start the game when everyone is ready (2-6 players)</li>
            <li>Roll dice and move around the board</li>
            <li>Buy properties, collect rent, build houses!</li>
            <li>Last player not bankrupt wins!</li>
          </ol>
        </motion.div>

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            marginTop: '60px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#8D99AE',
          }}
        >
          <p style={{ margin: '0 0 8px 0' }}>
            Open Source Monopoly Clone • Built with Next.js
          </p>
          <p style={{ margin: 0 }}>
            MIT License •{' '}
            <a href="https://github.com" style={{ color: '#1D3557' }}>
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}