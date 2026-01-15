
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { firebaseConfig, recaptchaEnterpriseSiteKey } from "./config/environment";

// Initialize Firebase with secure configuration
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  if (process.env.REACT_APP_APPCHECK_DEBUG === "true") {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    console.warn("App Check initialization skipped:", error);
  }

  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        // Analytics initialization failed - non-critical, app continues to work
        console.warn("Analytics initialization skipped:", e);
      }
    }
  }).catch(() => {
    // isSupported check failed - ignore
  });
}

export { app, auth, db, analytics };
