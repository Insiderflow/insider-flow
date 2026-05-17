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
      // Mobile SPA (IphoneAppUI) — asset files exist under public/app/assets; other /app/* → index.html
      {
        source: '/app',
        destination: '/app/index.html',
      },
      {
        source: '/app/:path*',
        destination: '/app/index.html',
      },
    ];
  },
};

module.exports = nextConfig;
























