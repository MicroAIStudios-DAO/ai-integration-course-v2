/**
 * Environment Configuration Utility
 * Reads from Vite's import.meta.env (browser-safe values prefixed VITE_).
 * Includes mobile-specific fallbacks and error handling.
 */

interface EnvironmentConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  app: {
    environment: 'development' | 'production' | 'test';
    version: string;
    isMobile: boolean;
    baseUrl: string;
  };
}

const env: Record<string, string | undefined> = (import.meta as any).env || {};

const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
};

/**
 * Mobile-specific environment variable getter with enhanced error handling
 */
const getMobileEnvVar = (key: string, fallback?: string): string => {
  let value = env[key];

  if (!value && isMobileDevice()) {
    console.warn(`Mobile device detected: Environment variable ${key} not found, checking fallbacks...`);

    if (typeof window !== 'undefined') {
      const windowEnv = (window as any).__ENV__;
      if (windowEnv && windowEnv[key]) {
        value = windowEnv[key];
        console.log(`Mobile fallback: Found ${key} on window.__ENV__`);
      }
    }
  }

  if (!value && fallback === undefined) {
    const errorMsg = `Environment variable ${key} is required but not set. Device: ${isMobileDevice() ? 'Mobile' : 'Desktop'}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return value || fallback || '';
};

/**
 * Validates that all required environment variables are present with mobile-specific handling
 */
const validateEnvironmentVariables = (): void => {
  if (env.MODE === 'test') {
    console.log('Test environment detected - skipping strict environment validation');
    return;
  }

  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID'
  ];

  const missingVars = requiredVars.filter(varName => {
    try {
      getMobileEnvVar(varName);
      return false;
    } catch {
      return true;
    }
  });

  if (missingVars.length > 0) {
    const deviceType = isMobileDevice() ? 'Mobile' : 'Desktop';
    const errorMsg = `[${deviceType}] Missing required environment variables: ${missingVars.join(', ')}. Please check your Firebase environment variable configuration.`;
    console.error(errorMsg);

    if (isMobileDevice()) {
      console.error('Mobile debugging info:', {
        userAgent: navigator.userAgent,
        availableEnvVars: Object.keys(env).filter(key => key.startsWith('VITE_')),
        windowEnv: typeof window !== 'undefined' ? (window as any).__ENV__ : 'undefined'
      });
    }

    throw new Error(errorMsg);
  }

  if (!env.VITE_RECAPTCHA_ENTERPRISE_KEY) {
    console.warn(
      'Optional environment variable VITE_RECAPTCHA_ENTERPRISE_KEY is not set. ' +
      'App will continue without App Check reCAPTCHA Enterprise initialization.'
    );
  }
};

/**
 * Safely retrieves environment variable with mobile-specific fallback
 */
const getEnvVar = (key: string, fallback?: string): string => {
  if (env.MODE === 'test') {
    const testFallbacks: Record<string, string> = {
      'VITE_FIREBASE_API_KEY': 'test_api_key',
      'VITE_FIREBASE_AUTH_DOMAIN': 'test-project.firebaseapp.com',
      'VITE_FIREBASE_PROJECT_ID': 'test-project',
      'VITE_FIREBASE_STORAGE_BUCKET': 'test-project.appspot.com',
      'VITE_FIREBASE_MESSAGING_SENDER_ID': '123456789',
      'VITE_FIREBASE_APP_ID': '1:123456789:web:abcdefg',
      'VITE_FIREBASE_MEASUREMENT_ID': 'G-ABCDEFG',
      'VITE_VERSION': '1.0.0',
      'VITE_NAME': 'AI Integration Course',
      'VITE_DEFAULT_LANGUAGE': 'en'
    };

    return env[key] || testFallbacks[key] || fallback || '';
  }

  return getMobileEnvVar(key, fallback);
};

/**
 * Determines the preferred application base URL with sensible fallbacks
 */
const resolveBaseUrl = (): string => {
  const envBaseUrl = getEnvVar('VITE_BASE_URL', '');

  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }

  return 'http://localhost:3000';
};

/**
 * Creates the environment configuration object with mobile support
 */
const createEnvironmentConfig = (): EnvironmentConfig => {
  const mobile = isMobileDevice();

  console.log(`Initializing environment config for ${mobile ? 'mobile' : 'desktop'} device`);

  validateEnvironmentVariables();

  const config = {
    firebase: {
      apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
      authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnvVar('VITE_FIREBASE_APP_ID'),
      measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
    },
    app: {
      environment: (env.MODE as 'development' | 'production' | 'test') || 'development',
      version: getEnvVar('VITE_VERSION', '1.0.0'),
      isMobile: mobile,
      baseUrl: resolveBaseUrl()
    }
  };

  if (mobile) {
    console.log('Mobile environment configuration loaded successfully');
    console.log('Firebase project (mobile):', config.firebase.projectId);
    console.log('User agent:', navigator.userAgent);
  }

  return config;
};

// Export the configuration object
export const config: EnvironmentConfig = createEnvironmentConfig();

// Export individual configurations for convenience
export const firebaseConfig = config.firebase;
export const recaptchaEnterpriseSiteKey = getEnvVar(
  'VITE_RECAPTCHA_ENTERPRISE_KEY',
  ''
);
export const appConfig = config.app;

// Export utility functions for testing
export { validateEnvironmentVariables, getEnvVar, isMobileDevice };

// Development helper - only log in development mode
if (env.DEV) {
  console.log('Environment configuration loaded successfully');
  console.log('Firebase project:', config.firebase.projectId);
  console.log('App environment:', config.app.environment);
  console.log('Device type:', config.app.isMobile ? 'Mobile' : 'Desktop');
}
