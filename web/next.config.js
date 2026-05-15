/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  outputFileTracingRoot: __dirname,
  // CI runs `tsc --noEmit` separately (see .github/workflows/test.yml). Skipping here
  // avoids a second heavy TypeScript pass during `next build` on 512MB hosts (e.g. Render).
  typescript: {
    ignoreBuildErrors: true,
  },
  // CI runs eslint via `npm run lint`. Skipping here cuts peak RSS during `next build`.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Next 15+: lowers webpack peak memory (slightly slower compile).
    webpackMemoryOptimizations: true,
  },
  async rewrites() {
    return [
      {
        source: "/insider/embed",
        destination:
          "http://localhost:3008/top?kind=insider&action=purchase",
      },
    ];
  },
};

module.exports = nextConfig;
