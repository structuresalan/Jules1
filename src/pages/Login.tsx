import React from 'react';
import { useAuth } from '../hooks/useAuth';
import simplifyStructLogo from '../assets/simplifystruct-logo.png';

export const Login: React.FC = () => {
  const { signInWithGoogle, mockLogin } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6 flex justify-center"><img src={simplifyStructLogo} alt="SimplifyStruct logo" className="h-20 w-auto object-contain" /></div>
        <h1 className="text-center text-2xl font-bold text-gray-900">Sign in to SimplifyStruct</h1>
        <p className="mt-2 text-gray-500">Access your structural calculation workspace.</p>
        <div className="mt-6 space-y-3">
          {signInWithGoogle && (
            <button
              onClick={signInWithGoogle}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign in with Google
            </button>
          )}
          {mockLogin && (
            <button
              onClick={mockLogin}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Demo Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};