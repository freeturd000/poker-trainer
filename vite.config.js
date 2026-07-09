import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update: a new service worker installs and takes over on the next
      // visit with no user prompt. Progress in localStorage is untouched by SW
      // updates — the SW only caches the app shell/assets, not app data.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Precache the whole built app shell so it works fully offline once
        // installed. Bump the size cap so the bundled assets (data JSON,
        // pokersolver, etc.) are all precached rather than skipped.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
      },
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Poker Trainer',
        short_name: 'Poker',
        description:
          'A local-first No-Limit Hold’em training suite — range drills, pot odds, board reading, a simulator, and more.',
        theme_color: '#065f46',
        background_color: '#065f46',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Enable the SW in `vite preview` so you can test install/offline from a
      // production build. It stays off during `npm run dev` to avoid caching
      // headaches while editing.
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
