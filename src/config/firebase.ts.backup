// =============================================================================
// Firebase Configuration - AI Integration Course
// Project: ai-integra-course-v2
// =============================================================================

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { getFunctions, Functions } from "firebase/functions";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbkztazekIxE8KUB2MydZXLVW7p52CUOQ",
  authDomain: "ai-integra-course-v2.firebaseapp.com",
  projectId: "ai-integra-course-v2",
  storageBucket: "ai-integra-course-v2.firebasestorage.app",
  messagingSenderId: "313115890482",
  appId: "1:313115890482:web:cca32371be86c0863cbd2b",
  measurementId: "G-15SDDF1S5S"
};

// Initialize Firebase (prevent re-initialization)
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const functions: Functions = getFunctions(app, "us-central1");

// Analytics (only in browser, not SSR)
let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Export everything
export { app, auth, db, storage, functions, analytics };
export default app;

// Type exports for convenience
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Functions, Analytics };
