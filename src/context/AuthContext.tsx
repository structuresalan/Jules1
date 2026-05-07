import React, { useEffect, useState } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from '../firebase';
import { AuthContext } from './authContextInstance';

const getAllowedEmail = () =>
  String(import.meta.env.VITE_ALLOWED_EMAIL || '')
    .trim()
    .toLowerCase();

const isAllowedUser = (candidate: User | null) => {
  const allowedEmail = getAllowedEmail();
  if (!candidate) return true;
  if (!allowedEmail) return true;

  return candidate.email?.trim().toLowerCase() === allowedEmail;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authConfigured = Boolean(auth);

  const login = async (email: string, password: string) => {
    const activeAuth = auth;

    if (!activeAuth) {
      throw new Error('Firebase is not configured yet. Add the Firebase environment variables in Vercel before logging in.');
    }

    const credential = await signInWithEmailAndPassword(activeAuth, email.trim(), password);

    if (!isAllowedUser(credential.user)) {
      await signOut(activeAuth);
      setUser(null);
      throw new Error('This email is not authorized for SimplifyStruct.');
    }

    setUser(credential.user);
  };

  const logout = async () => {
    const activeAuth = auth;

    if (activeAuth) {
      await signOut(activeAuth);
    }

    setUser(null);
  };

  // Kept only for local development fallback. The login screen no longer exposes this in production.
  const mockLogin = () => {
    if (!import.meta.env.DEV) return;
    setUser({ email: 'demo@example.com', uid: 'mock-uid' } as User);
  };

  const mockLogout = () => {
    setUser(null);
  };

  useEffect(() => {
    const activeAuth = auth;

    if (!activeAuth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(activeAuth, async (firebaseUser) => {
      if (firebaseUser && !isAllowedUser(firebaseUser)) {
        await signOut(activeAuth);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authConfigured,
        login,
        logout,
        mockLogin,
        mockLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
