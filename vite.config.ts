import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    basicSsl({
      name: 'vfnr-tutorial-local',
    }),
  ],
  server: {
    host: true,
    https: {},
  },
  preview: {
    host: true,
    https: {},
  },
  build: {
    target: 'es2022',
  },
});
