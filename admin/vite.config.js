import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    // Allow production admin hostname(s) when running `vite preview`
    allowedHosts: ['admin.jjtextiles.com', 'admin.shithaa.in'],
  },
})
