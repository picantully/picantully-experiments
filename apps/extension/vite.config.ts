import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webExtension from 'vite-plugin-web-extension'

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      // offscreen.html no se referencia en el manifest (se crea en runtime con
      // chrome.offscreen.createDocument), así que lo declaramos como input extra.
      additionalInputs: ['src/offscreen.html']
    })
  ]
})
