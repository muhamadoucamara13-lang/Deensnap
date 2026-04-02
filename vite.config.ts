import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'DeenSnap - Halal Scanner',
          short_name: 'DeenSnap',
          description: 'Escanea, analiza y descubre productos Halal con DeenSnap.',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'https://picsum.photos/seed/deensnap/192/192',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://picsum.photos/seed/deensnap/512/512',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'https://picsum.photos/seed/deensnap/512/512',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
