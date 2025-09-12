import { defineConfig } from 'vite'
import build from '@hono/vite-build/node'

export default defineConfig({
  plugins: [
    build({
      entry: './src/index.ts',
    }),
  ],
  define: {
    __filename: 'import.meta.url',
    __dirname: 'import.meta.url',
  },
  ssr: {
    noExternal: true,
  },
  build: {
    rollupOptions: {
      external: ['ws']
    }
  },
  server: {
    host: '0.0.0.0', // or 'localhost', '127.0.0.1', or specific IP
    port: 3000, // optional: specify port
  },
  preview: {
    host: '0.0.0.0', // or 'localhost', '127.0.0.1', or specific IP
    port: 4173, // optional: specify port
  },
})
