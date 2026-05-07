import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyArG6F-b9FmKxnyg4bEvMHxGsylXW4tFY8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "simplifystruct.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "simplifystruct",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "simplifystruct.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "923186693713",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:923186693713:web:1b71c090a5d70484abda70",
};

let auth: Auth | null = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "your_api_key") {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log("Firebase initialized");
  } else {
    console.warn(
      "Firebase config is missing or invalid. Authentication is disabled until Firebase credentials are provided.",
    );
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

export { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User };
