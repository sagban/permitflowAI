import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set third parameter to '' to load all env variables regardless of VITE_ prefix
  const env = loadEnv(mode, process.cwd(), '')
  
  const API_TARGET = env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  
  console.log('Vite proxy target:', API_TARGET)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/apps': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false,
        },
        '/run_sse': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

