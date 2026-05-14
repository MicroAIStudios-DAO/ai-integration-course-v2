import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// VULN-02: source maps disabled in prod to avoid exposing original source code.
// Override locally with VITE_SOURCEMAP=true if you need them for debugging.
const sourcemap = process.env.VITE_SOURCEMAP === 'true';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    viteTsconfigPaths(),
  ],
  server: {
    port: 3000,
    open: false,
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: 'build',
    sourcemap,
  },
});
