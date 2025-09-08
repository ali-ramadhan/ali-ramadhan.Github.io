import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  // Handle static assets
  assetsInclude: ['**/*.webm', '**/*.png', '**/*.jpg', '**/*.svg']
})