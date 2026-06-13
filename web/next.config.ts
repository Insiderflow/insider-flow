import type { NextConfig } from "next";
import path from "path";

const CRYPTO_APP = "https://insiderflow-crypto.vercel.app";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/crypto",
          destination: `${CRYPTO_APP}/crypto`,
        },
        {
          source: "/crypto/:path*",
          destination: `${CRYPTO_APP}/crypto/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
