import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
  },
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.js'),
  },
}) 