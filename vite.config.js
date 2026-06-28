import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 打包后不空白
  server: {
    host: "0.0.0.0",
    port: 3000, // 保持和以前一样的端口
    open: true
  }
})