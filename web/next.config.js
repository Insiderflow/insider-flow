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
    ];
  },
};

module.exports = nextConfig;
























