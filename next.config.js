/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For production, set your PartyKit host
  env: {
    NEXT_PUBLIC_PARTYKIT_HOST: process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999',
  },
};

module.exports = nextConfig;