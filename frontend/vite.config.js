import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    https: false,
    // Fail loudly on a port conflict instead of silently sliding to 5174.
    // With the default strictPort:false, a busy 5173 makes Vite serve the app
    // from 5174 while HMR stays pinned to 5173 (see the hmr note below) — that
    // mismatch is what produced the reload loop.
    strictPort: true,
    // Native fs.watch, NOT chokidar polling. An earlier version of this file set
    // usePolling:true/interval:1000 to "avoid" noisy Windows watcher events.
    // That is backwards: polling makes chokidar use fs.watchFile (a StatWatcher
    // per file) which compares mtime/ctime/size at a fixed interval and therefore
    // fires on metadata changes the native watcher deliberately filters out — it
    // reacts more, not less. Measured 0 mtime changes across src/ in 25s, so
    // polling bought nothing. The genuinely useful part is awaitWriteFinish,
    // which collapses a multi-write save (OneDrive / editors that write to a
    // temp file then rename) into a single event instead of several.
    watch: {
      usePolling: false,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
      // Keep build output, dependency caching, logs and editor/OneDrive temp
      // files from ever producing a watch event.
      ignored: [
        '**/dist/**',
        '**/node_modules/**',
        '**/.git/**',
        '**/*.log',
        '**/*~',
        '**/.#*',
        '**/*.tmp',
      ],
    },
    // No `hmr` override on purpose — this block was the root cause of the
    // self-refreshing page. Pinning hmr.port/hmr.host made Vite inject
    // __HMR_PORT__=5173 and __HMR_HOSTNAME__='127.0.0.1' into every client, so
    // a page served from ANY other port still opened its HMR socket against
    // 127.0.0.1:5173. That socket belongs to a different dev server (or the LAN
    // address differs), fails Vite's ?token= check, closes uncleanly, and the
    // client's close handler runs `await waitForSuccessfulPing(...)` followed by
    // `location.reload()` — see vite/dist/client/client.mjs:552-562. The ping
    // succeeds (a server is listening on 5173), so it reloads immediately, the
    // new client hits the same mismatch, and the loop repeats once per page
    // boot. That is the reported "reloads every 2–3 seconds".
    // Letting Vite derive HMR from server.host/server.port cannot desync.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
