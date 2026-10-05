import { defineConfig } from 'vite'

/**
 * Vite-конфигурация фронтенда десктопного приложения.
 * Tauri отдаёт собранные файлы из ../dist.
 */
export default defineConfig({
  root: '.',
  publicDir: 'public',
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: false,
    watch: {
      // Папка с Rust-кодом не отслеживается фронтендом
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: 'index.html',
        mini: 'mini-player.html',
      },
    },
  },
  esbuild: {
    legalComments: 'none',
  },
})
