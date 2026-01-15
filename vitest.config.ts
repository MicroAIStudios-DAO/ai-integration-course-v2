/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load environment variables for test mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      globals: true,
    },
    resolve: {
      alias: {
        // Mock firebase-functions for tests
        'firebase-functions/v2/https': new URL('./tests/__mocks__/firebase-functions-v2-https.ts', import.meta.url).pathname,
        'firebase-admin': new URL('./tests/__mocks__/firebase-admin.ts', import.meta.url).pathname,
        'node-fetch': new URL('./tests/__mocks__/node-fetch.ts', import.meta.url).pathname,
      }
    },
    define: {
      // Inject environment variables into the test environment
      'process.env': {
        NODE_ENV: JSON.stringify('test'),
        REACT_APP_FIREBASE_API_KEY: JSON.stringify(env.REACT_APP_FIREBASE_API_KEY || 'test_api_key'),
        REACT_APP_FIREBASE_AUTH_DOMAIN: JSON.stringify(env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'test-project.firebaseapp.com'),
        REACT_APP_FIREBASE_PROJECT_ID: JSON.stringify(env.REACT_APP_FIREBASE_PROJECT_ID || 'test-project'),
        REACT_APP_FIREBASE_STORAGE_BUCKET: JSON.stringify(env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'test-project.appspot.com'),
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: JSON.stringify(env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789'),
        REACT_APP_FIREBASE_APP_ID: JSON.stringify(env.REACT_APP_FIREBASE_APP_ID || '1:123456789:web:abcdefg'),
        REACT_APP_FIREBASE_MEASUREMENT_ID: JSON.stringify(env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-ABCDEFG'),
        REACT_APP_VERSION: JSON.stringify(env.REACT_APP_VERSION || '1.0.0'),
        REACT_APP_NAME: JSON.stringify(env.REACT_APP_NAME || 'AI Integration Course'),
        REACT_APP_DEFAULT_LANGUAGE: JSON.stringify(env.REACT_APP_DEFAULT_LANGUAGE || 'en'),
      }
    }
  }
})
