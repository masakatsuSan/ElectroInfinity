import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    // Expose on the LAN and serve over HTTPS (self-signed dev cert) so camera
    // (getUserMedia) and geolocation permission prompts appear on both the PC
    // and phones — browsers silently block these APIs on plain http:// links.
    host: true,
    https: true,
    proxy: {
      // Proxy API calls to backend during development
      // So frontend (port 5173) can call /api/... and it hits backend (port 5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy Socket.io (live attendance feed / QR rotation) to the backend too,
      // so phones connected to the dev server get real-time updates as well.
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
