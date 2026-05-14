/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    // Vitest exposes these on import.meta.env.VITE_* under MODE='test'.
    // Provide sensible defaults so suite runs without a populated .env.
    env: {
      VITE_FIREBASE_API_KEY: 'test_api_key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: '1:123456789:web:abcdefg',
      VITE_FIREBASE_MEASUREMENT_ID: 'G-ABCDEFG',
      VITE_VERSION: '1.0.0',
      VITE_NAME: 'AI Integration Course',
      VITE_DEFAULT_LANGUAGE: 'en',
    },
  },
  resolve: {
    alias: {
      'firebase-functions/v2/https': new URL('./tests/__mocks__/firebase-functions-v2-https.ts', import.meta.url).pathname,
      'firebase-admin': new URL('./tests/__mocks__/firebase-admin.ts', import.meta.url).pathname,
      'node-fetch': new URL('./tests/__mocks__/node-fetch.ts', import.meta.url).pathname,
    },
  },
})
