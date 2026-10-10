import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api calls are forwarded to the Node backend, so no CORS trouble in development
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, proxy: { '/api': 'http://localhost:5000' } },
});
