import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "/app/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY || "http://localhost:3000",
        changeOrigin: true,
      },
      "/images": {
        target: process.env.VITE_DEV_API_PROXY || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
