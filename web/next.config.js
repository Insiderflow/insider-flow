/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  async rewrites() {
    return [
      {
        source: '/insider/embed',
        destination: 'http://localhost:3008/top?kind=insider&action=purchase',
      },
      // Mobile SPA — static files under public/app/assets are served first; other /app/* → index.html
      {
        source: '/app',
        destination: '/app/index.html',
      },
      {
        source: '/app/',
        destination: '/app/index.html',
      },
      {
        source: '/app/:path((?!assets/).*)',
        destination: '/app/index.html',
      },
    ];
  },
};

module.exports = nextConfig;
























