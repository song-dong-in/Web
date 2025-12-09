// client/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // [핵심 수정] 로컬 환경의 백엔드 주소로 변경합니다.
    proxy: {
      '/api': {
        // 백엔드 서버가 로컬에서 실행되는 주소 (port 3000)
        target: 'http://localhost:3000', 
        changeOrigin: true,
        // rewrite는 경로 조작이 필요 없을 경우 간단하게 처리합니다.
        rewrite: (path) => path.replace(/^\/api/, '/api'), 
      },
    },
    // 로컬 개발 환경에서는 'localhost'를 사용해도 무방합니다.
    host: 'localhost', 
    port: 5173,
  },
});