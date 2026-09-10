import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.API_PROXY_TARGET || 'http://127.0.0.1:8000';
  return {
    plugins: [react()],
    base: command === 'build' ? '/static/ui/' : '/',
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/media': { target, changeOrigin: true },
      },
    },
    preview: {
      port: 4173,
      proxy: { '/api': { target, changeOrigin: true }, '/media': { target, changeOrigin: true } },
    },
  };
});
