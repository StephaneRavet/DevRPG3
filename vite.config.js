// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',  // Définit 'src' comme répertoire racine
  server: {
    watch: {
      usePolling: true,  // S'assure que les changements sont surveillés même dans des environnements avec des systèmes de fichiers virtuels
    },
    hmr: true,  // Active le Hot Module Replacement
    open: true,  // Ouvre automatiquement le navigateur lors du démarrage du serveur
  },
  build: {
    sourcemap: true,  // Génère des sourcemaps pour faciliter le débogage
  },
});