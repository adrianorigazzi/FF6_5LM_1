import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
	base: '/FF6_5LM_1/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
  },
})
