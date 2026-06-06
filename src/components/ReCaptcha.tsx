import React, { useEffect, useCallback } from 'react';
import { recaptchaEnterpriseSiteKey } from '../config/environment';

// Note: Window.grecaptcha type is declared in src/hooks/useReCaptcha.ts

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  action: string;
}

const SITE_KEY = recaptchaEnterpriseSiteKey;
const ReCaptcha: React.FC<ReCaptchaProps> = ({ onVerify, action }) => {
  
  const handleVerify = useCallback(async () => {
    if (window.grecaptcha) {
      try {
        const token = await window.grecaptcha.enterprise.execute(SITE_KEY, { action });
        onVerify(token);
      } catch (error) {
        console.error('reCAPTCHA error:', error);
      }
    }
  }, [onVerify, action]);

  useEffect(() => {
    if (window.grecaptcha?.enterprise) {
      window.grecaptcha.enterprise.ready(handleVerify);
      return;
    }

    const existingScript = document.querySelector('script[src*="recaptcha/enterprise"]') as HTMLScriptElement | null;
    if (existingScript) {
      const handleScriptLoad = () => {
        if (window.grecaptcha?.enterprise) {
          window.grecaptcha.enterprise.ready(handleVerify);
        }
      };
      existingScript.addEventListener('load', handleScriptLoad);
      // Immediately check again in case it finished loading
      if (window.grecaptcha?.enterprise) {
        window.grecaptcha.enterprise.ready(handleVerify);
      }
      return;
    }

    if (!SITE_KEY) {
      console.warn('reCAPTCHA site key is missing, skipping ReCaptcha rendering');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js?render=' + SITE_KEY;
    script.async = true;
    document.head.appendChild(script);
    
    script.onload = () => {
      window.grecaptcha.enterprise.ready(handleVerify);
    };
  }, [handleVerify]);

  return null; // Invisible reCAPTCHA
};

export default ReCaptcha;
