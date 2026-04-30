import { createContext } from 'react';
import type { User } from '../firebase';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  mockLogin: () => void;
  mockLogout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  mockLogin: () => {},
  mockLogout: () => {},
});
