const { i18n } = require('./next-i18next.config.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  images: {
    domains: ['images.unsplash.com'],
  },
  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hisl-hackathon.onrender.com';
    return [
      {
        source: '/api/results/:path*',
        destination: `${API_URL}/results/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
