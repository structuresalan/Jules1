import React, { useEffect, useState } from 'react';
import { auth, onAuthStateChanged, type User } from '../firebase';
import { AuthContext } from './authContextInstance';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock authentication fallback
  const mockLogin = () => {
    setUser({ email: 'demo@example.com', uid: 'mock-uid' } as User);
  };

  const mockLogout = () => {
    setUser(null);
  };

  useEffect(() => {
    if (!auth) {
      // If Firebase is not initialized, stop loading and allow mock auth
      setTimeout(() => setLoading(false), 0);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, mockLogin, mockLogout }}>
      {children}
    </AuthContext.Provider>
  );
};
