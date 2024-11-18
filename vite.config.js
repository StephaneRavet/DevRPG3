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
        enabled: true // Active le service worker en développement
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,json}'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:js)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'js-cache',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'images-cache',
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'static-resources'
            }
          }
        ],
        navigateFallback: './offline.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      injectRegister: 'auto',
      strategies: 'injectManifest',
      srcDir: 'dev-dist',
      filename: 'sw.js',
      // Ajoutez ces lignes pour le fallback
      navigateFallback: './offline.html',
      navigateFallbackDenylist: [/^\/api\//],
    })
  ]
});