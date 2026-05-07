import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import simplifyStructLogo from '../assets/simplifystruct-logo.png';

export const Login: React.FC = () => {
  const { user, mockLogin } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleMockLogin = () => {
    mockLogin();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6 flex justify-center">
          <img
            src={simplifyStructLogo}
            alt="SimplifyStruct logo"
            className="h-16 max-w-[280px] object-contain"
          />
        </div>

        <h1 className="text-center text-2xl font-bold text-gray-900">
          Sign in to SimplifyStruct
        </h1>
        <p className="mt-3 text-center text-gray-500">
          Professional structural calculations.
        </p>

        <div className="mt-8 rounded-lg bg-blue-50 p-4 text-blue-700">
          Firebase is not fully configured in this prototype. Click below to use the mock login.
        </div>

        <button
          onClick={handleMockLogin}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          Sign In (Mock)
        </button>
      </div>
    </div>
  );
};
