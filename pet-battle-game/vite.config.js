import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      // index.html = the game, viewer.html = the artists' model viewer
      input: { main: 'index.html', viewer: 'viewer.html' },
      output: { manualChunks: { three: ['three'] } },
    },
  },
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
});
