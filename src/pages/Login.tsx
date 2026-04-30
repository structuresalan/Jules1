import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const Login: React.FC = () => {
  const { mockLogin } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4"></div>
          <h1 className="text-2xl font-semibold text-gray-900">Sign in to StrucCalc</h1>
          <p className="text-gray-500 mt-2">Professional structural calculations.</p>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
            Firebase is not fully configured in this prototype. Click below to use the mock login.
          </div>
          <button
            onClick={mockLogin}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sign In (Mock)
          </button>
        </div>
      </div>
    </div>
  );
};
