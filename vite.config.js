import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
var __dirname = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    base: './',
    plugins: [react(), crx({ manifest: manifest })],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173,
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
        },
    },
});
