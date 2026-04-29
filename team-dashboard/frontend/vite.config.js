import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from '@douyinfe/vite-plugin-semi'
const { vitePluginSemi } = pkg

export default defineConfig({
  plugins: [react(), vitePluginSemi()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
