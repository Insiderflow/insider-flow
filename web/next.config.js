/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/insider/embed',
        destination: 'http://localhost:3008/top?kind=insider&action=purchase',
      },
    ];
  },
};

module.exports = nextConfig;







