/**
 * Environment Configuration Utility
 * Securely handles environment variables without exposing them in the codebase
 * Includes mobile-specific fallbacks and error handling
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

/**
 * Detects if the current device is mobile
 */
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
  // Try to get the environment variable
  let value = process.env[key];
  
  // Mobile-specific fallback handling
  if (!value && isMobileDevice()) {
    console.warn(`Mobile device detected: Environment variable ${key} not found, checking fallbacks...`);
    
    // For mobile devices, try alternative approaches
    if (typeof window !== 'undefined') {
      // Check if variables are available on window object (some mobile browsers)
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
  // Skip validation in test environment with fallback values
  if (process.env.NODE_ENV === 'test') {
    console.log('Test environment detected - skipping strict environment validation');
    return;
  }

  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID',
    'REACT_APP_FIREBASE_MEASUREMENT_ID',
    'REACT_APP_RECAPTCHA_ENTERPRISE_KEY'
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
    
    // For mobile devices, provide additional debugging info
    if (isMobileDevice()) {
      console.error('Mobile debugging info:', {
        userAgent: navigator.userAgent,
        availableEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')),
        windowEnv: typeof window !== 'undefined' ? (window as any).__ENV__ : 'undefined'
      });
    }
    
    throw new Error(errorMsg);
  }
};

/**
 * Safely retrieves environment variable with mobile-specific fallback
 */
const getEnvVar = (key: string, fallback?: string): string => {
  // In test environment, provide sensible fallbacks for Firebase variables
  if (process.env.NODE_ENV === 'test') {
    const testFallbacks: Record<string, string> = {
      'REACT_APP_FIREBASE_API_KEY': 'test_api_key',
      'REACT_APP_FIREBASE_AUTH_DOMAIN': 'test-project.firebaseapp.com',
      'REACT_APP_FIREBASE_PROJECT_ID': 'test-project',
      'REACT_APP_FIREBASE_STORAGE_BUCKET': 'test-project.appspot.com',
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID': '123456789',
      'REACT_APP_FIREBASE_APP_ID': '1:123456789:web:abcdefg',
      'REACT_APP_FIREBASE_MEASUREMENT_ID': 'G-ABCDEFG',
      'REACT_APP_VERSION': '1.0.0',
      'REACT_APP_NAME': 'AI Integration Course',
      'REACT_APP_DEFAULT_LANGUAGE': 'en'
    };
    
    return process.env[key] || testFallbacks[key] || fallback || '';
  }
  
  return getMobileEnvVar(key, fallback);
};

/**
 * Determines the preferred application base URL with sensible fallbacks
 */
const resolveBaseUrl = (): string => {
  const envBaseUrl = getEnvVar('REACT_APP_BASE_URL', '');

  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }

  // Default fallback for server-side or build-time execution
  return 'http://localhost:3000';
};

/**
 * Creates the environment configuration object with mobile support
 */
const createEnvironmentConfig = (): EnvironmentConfig => {
  const mobile = isMobileDevice();

  console.log(`Initializing environment config for ${mobile ? 'mobile' : 'desktop'} device`);
  
  // Validate all required variables are present
  validateEnvironmentVariables();

  const config = {
    firebase: {
      apiKey: getEnvVar('REACT_APP_FIREBASE_API_KEY'),
      authDomain: getEnvVar('REACT_APP_FIREBASE_AUTH_DOMAIN'),
      projectId: getEnvVar('REACT_APP_FIREBASE_PROJECT_ID'),
      storageBucket: getEnvVar('REACT_APP_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnvVar('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnvVar('REACT_APP_FIREBASE_APP_ID'),
      measurementId: getEnvVar('REACT_APP_FIREBASE_MEASUREMENT_ID')
    },
    app: {
      environment: (getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test'),
      version: getEnvVar('REACT_APP_VERSION', '1.0.0'),
      isMobile: mobile,
      baseUrl: resolveBaseUrl()
    }
  };
  
  // Mobile-specific logging
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
  'REACT_APP_RECAPTCHA_ENTERPRISE_KEY'
);
export const appConfig = config.app;

// Export utility functions for testing
export { validateEnvironmentVariables, getEnvVar, isMobileDevice };

// Development helper - only log in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('Environment configuration loaded successfully');
  console.log('Firebase project:', config.firebase.projectId);
  console.log('App environment:', config.app.environment);
  console.log('Device type:', config.app.isMobile ? 'Mobile' : 'Desktop');
}

// Force deployment with mobile fixes Fri Aug  9 15:10:00 EDT 2025
