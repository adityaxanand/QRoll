
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics';

let app: FirebaseApp | undefined;
let authModule: Auth | undefined; // Renamed to avoid conflict with auth variable in AuthContext
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | undefined;

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

if (process.env.NODE_ENV === 'development') {
  console.groupCollapsed("[Firebase Setup] Environment Variables & Config");
  Object.entries(firebaseConfigValues).forEach(([key, value]) => {
    console.log(`${key}:`, value || "NOT SET/EMPTY");
  });
  console.log("Full config for initializeApp (if all values present):", JSON.parse(JSON.stringify(firebaseConfigValues)));
  console.groupEnd();
}

const requiredKeys: (keyof typeof firebaseConfigValues)[] = [
  'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
];
let hasCriticalConfigurationIssue = false;

for (const key of requiredKeys) {
  const value = firebaseConfigValues[key];
  if (!value || (typeof value === 'string' && (value.startsWith('YOUR_') || value.startsWith('PASTE_') || value === 'null' || value === 'undefined' || value.trim() === ''))) {
    console.error(`Firebase Config Error: Required key "NEXT_PUBLIC_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}" is missing, placeholder, or empty. Check .env.local or environment variables.`);
    hasCriticalConfigurationIssue = true;
  }
}

if (hasCriticalConfigurationIssue) {
  console.warn("Firebase SDK will not be initialized due to critical configuration issues. Some Firebase-dependent features may not work.");
} else {
  if (!getApps().length) {
    try {
      // Filter out undefined/null values before initializing
      const validConfig: { [key: string]: string } = {};
      for (const key in firebaseConfigValues) {
        const typedKey = key as keyof typeof firebaseConfigValues;
        if (firebaseConfigValues[typedKey]) {
          validConfig[key] = firebaseConfigValues[typedKey]!;
        }
      }
      app = initializeApp(validConfig);
      console.log("Firebase App initialized successfully.");
    } catch (e: any) {
      console.error("Firebase initialization error:", e.message, e.code);
      // This specific error often means some config values are still missing or invalid despite the earlier check
      if (e.code === 'auth/invalid-api-key' || e.message?.includes('apiKey')) {
         console.error("Double check NEXT_PUBLIC_FIREBASE_API_KEY value.");
      }
      if (e.code === 'auth/configuration-not-found' || e.message?.includes('projectId')) {
         console.error("This usually means the Firebase project ID is incorrect or the app isn't correctly registered in Firebase project settings.");
      }
      hasCriticalConfigurationIssue = true; // Mark as issue if init fails
    }
  } else {
    app = getApp();
  }

  if (app && !hasCriticalConfigurationIssue) {
    try { authModule = getAuth(app); } catch (e) { console.error("Firebase Auth init error:", e); }
    try { db = getFirestore(app); } catch (e) { console.error("Firebase Firestore init error:", e); }
    try { storage = getStorage(app); } catch (e) { console.error("Firebase Storage init error:", e); }

    // Initialize Analytics only on the client side and if measurementId is provided
    if (typeof window !== 'undefined' && firebaseConfigValues.measurementId && !firebaseConfigValues.measurementId.startsWith("YOUR_")) {
      isSupported().then((supported) => {
        if (supported && app) {
          try {
            analytics = getAnalytics(app);
            console.log("Firebase Analytics initialized (client-side).");
          } catch (e) {
            console.error("Firebase Analytics client init error:", e);
          }
        }
      }).catch(error => {
        console.error("Error checking Firebase Analytics support:", error);
      });
    } else if (typeof window !== 'undefined' && (!firebaseConfigValues.measurementId || firebaseConfigValues.measurementId.startsWith("YOUR_")) && !hasCriticalConfigurationIssue) {
       // console.log("Firebase Analytics not initialized: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is missing or a placeholder (this is optional).");
    }
  }
}
// Export auth as 'auth' for consistency with how it's typically imported.
export { app, authModule as auth, db, storage, analytics };
