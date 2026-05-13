import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import simplifyStructLogo from '../assets/simplifystruct-logo.png';

type AuthMode = 'signin' | 'create';

export const Login: React.FC = () => {
  const { user, login, createAccount, authConfigured } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (authMode === 'create' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'create') {
        await createAccount(email, password, inviteCode);
      } else {
        await login(email, password);
      }

      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to continue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMessage('');
    setPassword('');
    setConfirmPassword('');
    setInviteCode('');
  };

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={simplifyStructLogo}
            alt="SimplifyStruct logo"
            className="h-12 rounded-lg bg-white/90 object-contain px-2 py-1"
          />
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-700 mb-6">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                authMode === 'signin'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('create')}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                authMode === 'create'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {!authConfigured && (
            <div className="mb-4 text-xs text-amber-300 bg-amber-900/20 border border-amber-700/50 rounded-lg px-3 py-2">
              Firebase is not configured yet. Add the Firebase environment variables in Vercel, then redeploy.
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 text-xs text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-3 py-2">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                placeholder="Password"
                autoComplete={authMode === 'create' ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
            </div>

            {authMode === 'create' && (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={inputClass}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wide">Invite Code</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    className={inputClass}
                    placeholder="Enter invite code"
                    autoComplete="off"
                    required
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={!authConfigured || isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? authMode === 'create'
                  ? 'Creating account...'
                  : 'Signing in...'
                : authMode === 'create'
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer disclaimer */}
        <p className="mt-6 text-center text-[10px] text-slate-600">
          NOT FOR CONSTRUCTION. Engineer of Record must verify all calculations.
          By using this tool, you accept the Terms of Use and liability disclaimer.
        </p>
      </div>
    </div>
  );
};
