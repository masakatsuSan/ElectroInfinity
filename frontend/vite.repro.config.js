// TEMPORARY reproduction config — identical to the committed config but with
// the original buggy `hmr: { port: 5173, host: '127.0.0.1' }` override, used
// only to demonstrate the reload loop. Deleted after verification.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    https: false,
    watch: { usePolling: true, interval: 1000, ignored: ['**/dist/**', '**/node_modules/**'] },
    hmr: { port: 5173, host: '127.0.0.1' },
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },
})
