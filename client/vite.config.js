import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Hotel Sri Vari client.
// - Dev server binds 0.0.0.0 so the Arena preview can reach it.
// - /api/* is proxied to the Express backend (browser never calls localhost directly).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:4000',
        changeOrigin: false,
      },
    },
  },
})
