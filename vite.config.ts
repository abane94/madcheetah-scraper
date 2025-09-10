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
})
