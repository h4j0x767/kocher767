import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Stub out Capacitor packages so they never cause import errors in the browser
          '@capacitor-community/biometric-auth': path.resolve(__dirname, 'src/stubs/capacitor-stub.ts'),
          '@capacitor/local-notifications': path.resolve(__dirname, 'src/stubs/capacitor-stub.ts'),
        }
      },
      optimizeDeps: {
        exclude: ['@capacitor-community/biometric-auth', '@capacitor/local-notifications'],
      },
    };
});
