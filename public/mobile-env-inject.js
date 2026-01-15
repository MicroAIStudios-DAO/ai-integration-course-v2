/**
 * Mobile Environment Variable Injection Script
 * This script helps inject environment variables for mobile browsers
 * that might have issues with the standard process.env approach
 */

(function() {
  'use strict';
  
  // Only run on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    console.log('Mobile device detected - injecting environment variables');
    
    // Create a global environment object for mobile fallback
    window.__ENV__ = window.__ENV__ || {};
    
    // Firebase configuration for mobile fallback
    // These placeholders are replaced during the production build process
    window.__ENV__.REACT_APP_FIREBASE_API_KEY = '%REACT_APP_FIREBASE_API_KEY%';
    window.__ENV__.REACT_APP_FIREBASE_AUTH_DOMAIN = '%REACT_APP_FIREBASE_AUTH_DOMAIN%';
    window.__ENV__.REACT_APP_FIREBASE_PROJECT_ID = '%REACT_APP_FIREBASE_PROJECT_ID%';
    window.__ENV__.REACT_APP_FIREBASE_STORAGE_BUCKET = '%REACT_APP_FIREBASE_STORAGE_BUCKET%';
    window.__ENV__.REACT_APP_FIREBASE_MESSAGING_SENDER_ID = '%REACT_APP_FIREBASE_MESSAGING_SENDER_ID%';
    window.__ENV__.REACT_APP_FIREBASE_APP_ID = '%REACT_APP_FIREBASE_APP_ID%';
    window.__ENV__.REACT_APP_FIREBASE_MEASUREMENT_ID = '%REACT_APP_FIREBASE_MEASUREMENT_ID%';
    
    console.log('Mobile environment variables injected:', Object.keys(window.__ENV__));
  }
})();

