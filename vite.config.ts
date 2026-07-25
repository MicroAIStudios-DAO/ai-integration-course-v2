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
    rollupOptions: {
      output: {
        // Only pin dependencies that every route needs at boot. Anything else is
        // left to Rollup's automatic splitting so a library used by a single
        // lazily-loaded route ships in that route's chunk instead of the initial
        // payload. Matching on the package directory (not a bare substring) keeps
        // e.g. react-markdown out of react-core.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
            return 'react-core';
          }
          if (/node_modules\/(@firebase|firebase)\//.test(id)) {
            return 'firebase';
          }
          if (/node_modules\/@?stripe\//.test(id)) {
            return 'stripe';
          }
        },
      },
    },
  },
});
