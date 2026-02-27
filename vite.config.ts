import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'pdf-lib-encrypt-js': path.resolve(__dirname, 'node_modules/pdf-lib-encrypt-js/src/index.ts'),
        'src/api': path.resolve(__dirname, 'node_modules/pdf-lib-encrypt-js/src/api'),
        'src/core': path.resolve(__dirname, 'node_modules/pdf-lib-encrypt-js/src/core'),
        'src/types': path.resolve(__dirname, 'node_modules/pdf-lib-encrypt-js/src/types'),
        'src/utils': path.resolve(__dirname, 'node_modules/pdf-lib-encrypt-js/src/utils'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
