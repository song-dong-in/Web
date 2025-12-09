import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // '/api'로 시작하는 요청이 오면 3000번 포트(Node.js 서버)로 보낸다!
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})