// client/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // [핵심] 3000번 포트의 백엔드 서비스 이름으로 요청을 보냅니다.
    proxy: {
      '/api': {
        // Minikube 환경에서는 쿠버네티스 서비스 이름으로 접근해야 합니다.
        target: 'http://bookstore-back-service:3000', 
        changeOrigin: true,
        // 프론트엔드에서 /api 경로를 요청하면, 백엔드로 전달됩니다.
        rewrite: (path) => path.replace(/^\/api/, '/api'), 
      },
    },
    // 컨테이너 내부에서 접근 가능하도록 호스트를 설정합니다.
    host: '0.0.0.0',
    port: 5173,
  },
});