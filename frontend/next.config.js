/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      {
        source: '/api/results/:path*',
        destination: 'http://localhost:8000/results/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
