import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon-32x32.png',
        'favicon-16x16.png',
        'logo-vymc.svg',
        'apple-touch-icon.png',
        'icons/favicon-192x192.png',
        'icons/favicon-512x512.png'
      ],
      manifest: {
        name: 'Gestor de Reunión Vida y Ministerio Cristiano',
        short_name: 'VMC',
        start_url: '/',
        display: 'standalone',
        theme_color: '#1e1e1e',
        background_color: '#1e1e1e',
        icons: [
          {
            src: '/icons/favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
