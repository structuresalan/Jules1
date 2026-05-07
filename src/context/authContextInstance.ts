import { createContext } from 'react';
import type { User } from '../firebase';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  authConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  mockLogin: () => void;
  mockLogout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authConfigured: false,
  login: async () => {},
  logout: async () => {},
  mockLogin: () => {},
  mockLogout: () => {},
});
