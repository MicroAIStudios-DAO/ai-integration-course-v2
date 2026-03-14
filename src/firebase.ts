import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { firebaseConfig, recaptchaEnterpriseSiteKey } from "./config/environment";

// Canonical Firebase client bootstrap shared by the entire app.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, "us-central1");

let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== "undefined") {
  if (process.env.REACT_APP_APPCHECK_DEBUG === "true") {
    (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  if (recaptchaEnterpriseSiteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.warn("App Check initialization skipped:", error);
    }
  } else {
    console.warn("App Check disabled: REACT_APP_RECAPTCHA_ENTERPRISE_KEY is not configured.");
  }

  isSupported()
    .then((supported) => {
      if (!supported) return;
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.warn("Analytics initialization skipped:", error);
      }
    })
    .catch(() => {
      // Ignore analytics support probe failures.
    });
}

export { app, auth, db, storage, functions, analytics };
