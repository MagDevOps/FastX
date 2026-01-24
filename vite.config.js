import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    charset: 'utf-8'
  },
  build: {
    charset: 'utf-8',
    rollupOptions: {
      output: {
        charset: 'utf-8'
      }
    }
  },
  esbuild: {
    charset: 'utf8'
  }
})
