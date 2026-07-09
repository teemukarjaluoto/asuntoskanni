import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            manifest: {
                name: 'AsuntoSkanni',
                short_name: 'AsuntoSkanni',
                description: 'Skannaa asunto 3D-virtuaaliesittelyä varten',
                theme_color: '#0b0f14',
                background_color: '#0b0f14',
                display: 'standalone',
                orientation: 'portrait',
                icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
            },
        }),
    ],
    server: { host: true },
});
