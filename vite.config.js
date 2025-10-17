import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/wildsea/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
