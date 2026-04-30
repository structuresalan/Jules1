import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth: Auth | null = null;

try {
  // Only initialize if we have at least an API key
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log("Firebase initialized");
  } else {
    console.warn("Firebase config is missing or invalid. Authentication will be mocked or disabled. To use real authentication, fill out your .env file with Firebase credentials.");
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

export { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User };
