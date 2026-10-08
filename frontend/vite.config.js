import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy Cashfree sandbox API calls to avoid CORS in local dev
      '/cashfree-proxy': {
        target: 'https://sandbox.cashfree.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cashfree-proxy/, '/pg'),
      },
      // Proxy Cashfree production API calls
      '/cashfree-proxy-prod': {
        target: 'https://api.cashfree.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cashfree-proxy-prod/, '/pg'),
      },
    }
  }
})
