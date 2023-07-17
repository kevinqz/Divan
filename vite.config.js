import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import rawPlugin from "vite-plugin-raw";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), rawPlugin()],
  server: {
    host: true
  }
})
