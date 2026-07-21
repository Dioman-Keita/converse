import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { resolve } from 'path'

const src = (p:string) => resolve(__dirname, 'src', p)

const config = defineConfig({
  resolve: { 
    tsconfigPaths: true,
    alias: {
      '@component': src("component"),
      '@entities': src("entities"),
      '@pages': src("pages")
    }
   },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
