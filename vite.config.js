// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
        open: true
    },
    build: {
        target: 'esnext',
        assetsInlineLimit: 4096,
        rollupOptions: {
            output: {
                manualChunks: {
                    pixi: ['pixi.js']
                }
            }
        }
    }
});