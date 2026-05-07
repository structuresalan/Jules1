import React, { useEffect, useState } from 'react';
import {
  auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from '../firebase';
import { AuthContext } from './authContextInstance';

const getSignupInviteCode = () =>
  String(import.meta.env.VITE_SIGNUP_INVITE_CODE || '')
    .trim();

const isValidInviteCode = (inviteCode = '') => {
  const requiredInviteCode = getSignupInviteCode();
  if (!requiredInviteCode) return true;

  return inviteCode.trim() === requiredInviteCode;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authConfigured = Boolean(auth);

  const createAccount = async (email: string, password: string, inviteCode = '') => {
    const activeAuth = auth;
    const normalizedEmail = email.trim();

    if (!activeAuth) {
      throw new Error('Firebase is not configured yet. Add the Firebase environment variables in Vercel before creating an account.');
    }

    if (!isValidInviteCode(inviteCode)) {
      throw new Error('Invalid signup code.');
    }

    const credential = await createUserWithEmailAndPassword(activeAuth, normalizedEmail, password);
    setUser(credential.user);
  };

  const login = async (email: string, password: string) => {
    const activeAuth = auth;

    if (!activeAuth) {
      throw new Error('Firebase is not configured yet. Add the Firebase environment variables in Vercel before logging in.');
    }

    const credential = await signInWithEmailAndPassword(activeAuth, email.trim(), password);
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

    const unsubscribe = onAuthStateChanged(activeAuth, (firebaseUser) => {
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
        createAccount,
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
