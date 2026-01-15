import { useState, useCallback, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

const SITE_KEY = '6LfdjDosAAAAAnRKcsZQSQLGYVA188hLY_O_naP';
interface VerifyRecaptchaResponse {
  success: boolean;
  score: number | null;
  action: string | null;
  reasons: string[];
  error?: string;
}

declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        ready: (callback: () => void) => Promise<void>;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

export const useReCaptcha = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  const loadReCaptcha = useCallback(() => {
    if (document.querySelector('script[src*="recaptcha/enterprise"]')) {
      if (window.grecaptcha?.enterprise) {
        setIsLoaded(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => {
      window.grecaptcha.enterprise.ready(() => {
        setIsLoaded(true);
      });
    };
    document.head.appendChild(script);
  }, []);

  const executeReCaptcha = useCallback(async (action: string): Promise<string | null> => {
    if (!window.grecaptcha?.enterprise) {
      console.error('reCAPTCHA not loaded');
      return null;
    }

    try {
      await window.grecaptcha.enterprise.ready(() => {});
      const token = await window.grecaptcha.enterprise.execute(SITE_KEY, { action });
      return token;
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      return null;
    }
  }, []);

  /**
   * Execute reCAPTCHA and verify with backend.
   * Returns the verification result from the server.
   */
  const executeAndVerify = useCallback(async (action: string): Promise<VerifyRecaptchaResponse | null> => {
    const token = await executeReCaptcha(action);
    if (!token) {
      return null;
    }

    try {
      const functions = getFunctions(app);
      const verifyRecaptcha = httpsCallable<{ token: string; action: string }, VerifyRecaptchaResponse>(
        functions,
        'verifyRecaptcha'
      );
      const result = await verifyRecaptcha({ token, action });
      return result.data;
    } catch (error) {
      console.error('Backend verification failed:', error);
      return null;
    }
  }, [executeReCaptcha]);

  // Auto-load on mount
  useEffect(() => {
    loadReCaptcha();
  }, [loadReCaptcha]);

  return { loadReCaptcha, executeReCaptcha, executeAndVerify, isLoaded };
};

export default useReCaptcha;
