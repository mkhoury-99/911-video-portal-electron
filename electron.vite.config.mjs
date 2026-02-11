import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)))

export default defineConfig({
  main: {},
  preload: {},
  renderer: (() => {
    const env = loadEnv(process.env.NODE_ENV ?? 'development', projectRoot, ['VITE_', 'RENDERER_VITE_'])
    return {
      envDir: projectRoot,
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src')
        }
      },
      define: {
        'import.meta.env.VITE_API_URL': JSON.stringify((env.VITE_API_URL ?? '').replace(/^['"]|['"]$/g, ''))
      },
      plugins: [react(), tailwindcss()]
    }
  })()
})
