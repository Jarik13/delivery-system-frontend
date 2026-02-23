import { defineConfig } from 'vite';
import react from '@vitejs/react-refresh';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Delivery System Courier',
        short_name: 'DSCourier',
        description: 'Система керування доставкою для кур\'єрів',
        theme_color: '#673ab7',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});