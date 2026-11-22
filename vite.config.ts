import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const envFilePath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envFilePath)) {
    const fileEnv = dotenv.parse(fs.readFileSync(envFilePath, 'utf-8'));
    for (const [key, value] of Object.entries(fileEnv)) {
      if (value) {
        process.env[key] = value;
      }
    }
    if (fileEnv.VITE_SUPABASE_URL && !fileEnv.VITE_SUPABASE_ANON_KEY) {
      delete process.env.VITE_SUPABASE_ANON_KEY;
    }
  }

  loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
