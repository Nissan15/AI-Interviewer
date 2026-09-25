import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { aiServerMiddleware } from './server/middleware.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all server environment variables (including non-VITE prefixed ones) into process.env
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      {
        name: 'ai-server-middleware',
        configureServer(server) {
          server.middlewares.use(aiServerMiddleware)
        },
        configurePreviewServer(server) {
          server.middlewares.use(aiServerMiddleware)
        },
      },
    ],
  }
})
