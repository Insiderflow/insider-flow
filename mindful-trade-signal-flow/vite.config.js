import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

// https://vite.dev/config/
function insiderflowMobileProductionGuard(mode, cwd) {
  return {
    name: 'insiderflow-mobile-production-guard',
    configResolved() {
      if (mode !== 'production') return
      const prodEnv = loadEnv('production', cwd, '')
      if ((prodEnv.VITE_AUTH_TRANSPORT || '').toLowerCase() !== 'mobile') return
      const api = (prodEnv.VITE_API_BASE_URL || '').trim()
      if (!api.startsWith('https://')) {
        throw new Error(
          '[store build] VITE_API_BASE_URL must start with https:// when VITE_AUTH_TRANSPORT=mobile',
        )
      }
      if (/localhost|127\.0\.0\.1/i.test(api)) {
        throw new Error('[store build] VITE_API_BASE_URL must not use localhost for mobile release')
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendOrigin = env.VITE_BACKEND_ORIGIN || 'http://localhost:3000'

  return {
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    react(),
    insiderflowMobileProductionGuard(mode, process.cwd()),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: backendOrigin,
        changeOrigin: true,
      },
    },
  },
  }
});