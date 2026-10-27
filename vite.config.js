import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        // also reachable from phones/tablets on the same Wi-Fi: http://<this computer's IP>:5173
        host: true,
        // during development the API runs separately (npm run server)
        proxy: { '/api': 'http://localhost:3001' },
    },
});
