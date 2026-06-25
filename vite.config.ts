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
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // Large SDKs used across the app — keep in stable, long-cached chunks.
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('stripe')) return 'stripe';

          // Core React runtime needed on every route. Intentionally scoped to
          // the runtime + router and EXCLUDES react-markdown / react-player,
          // which are dynamically imported (see LazyMarkdown / LessonPage) and
          // must stay free to split into their own async chunks. The previous
          // broad `react` match swept those heavy libs into this eager chunk.
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/react-helmet') ||
            id.includes('/scheduler/')
          ) {
            return 'react-core';
          }

          // Everything else is left to Rollup's default chunking so modules
          // reachable only through a dynamic import land in async chunks rather
          // than being forced into an eager vendor bundle.
          return undefined;
        },
      },
    },
  },
});
