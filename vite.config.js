// vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: 'src',
  server: {
    watch: {
      usePolling: true,
    },
    hmr: true,
    open: true,
  },
  build: {
    sourcemap: true,
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'DevRPG - Le RPG des développeurs',
        short_name: 'DevRPG',
        start_url: '/',
        display: 'standalone',
        description: 'Un jeu de rôle où vous progressez en relevant des défis de développement',
        lang: 'fr',
        dir: 'auto',
        theme_color: '#1E293B',
        background_color: '#0F172A',
        orientation: 'any',
        icons: [
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ]
});