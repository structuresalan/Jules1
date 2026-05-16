import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BrandMark } from '../components/BrandMark';
import type { Tier } from '../lib/userProfile';
import { auth, sendPasswordResetEmail } from '../firebase';
import './Login.css';

type AuthMode = 'signin' | 'create' | 'reset';

const strengthLabels = ['—', 'WEAK', 'FAIR', 'GOOD', 'STRONG'];

function getStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export const Login: React.FC = () => {
  const { user, login, createAccount, authConfigured } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [discipline, setDiscipline] = useState('Structural');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier>('private');
  const [resetSent, setResetSent] = useState(false);
  const pwStrength = getStrength(password);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (authMode === 'create' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'create') {
        await createAccount(email, password, inviteCode, selectedTier, `${firstName} ${lastName}`.trim(), company, discipline);
        navigate('/', { replace: true });
      } else if (authMode === 'reset') {
        if (!auth) throw new Error('Firebase not configured');
        await sendPasswordResetEmail(auth, email.trim());
        setResetSent(true);
      } else {
        await login(email, password);
        navigate('/', { replace: true });
      }
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
    setShowPassword(false);
    setResetSent(false);
  };

  const ctrlS: React.CSSProperties = {
    position: 'relative', display: 'flex', alignItems: 'center',
    border: '1px solid #d6dae3', background: '#ffffff', borderRadius: 6,
    colorScheme: 'light',
  };
  const inpS: React.CSSProperties = {
    flex: 1, minWidth: 0, border: 'none', outline: 'none',
    background: '#ffffff', backgroundColor: '#ffffff',
    padding: '10px 12px', fontSize: 13.5,
    color: '#11131a', fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    colorScheme: 'light',
  };
  const lblS: React.CSSProperties = {
    fontSize: 12, color: '#374151', fontWeight: 500,
    display: 'flex', justifyContent: 'space-between', marginBottom: 6,
  };
  const hintS: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
    color: '#9aa1ad', letterSpacing: '.06em', fontWeight: 400,
  };
  const iconWrap: React.CSSProperties = {
    padding: '0 0 0 12px', color: '#9aa1ad', display: 'flex', alignItems: 'center', flexShrink: 0,
    background: '#ffffff',
  };
  const fieldS: React.CSSProperties = { display: 'flex', flexDirection: 'column', marginBottom: 14 };

  return (
    <div id="login-page" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* top status bar */}
      <div className="login-topbar">
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', marginRight: 8, flexShrink: 0, boxShadow: '0 0 0 3px rgba(22,163,74,.15)', display: 'inline-block' }} />
        <span>SECURE&nbsp;CONNECTION</span>
        <span style={{ margin: '0 14px', color: '#3a3f4b' }}>│</span>
        <span>VER&nbsp;<b style={{ fontWeight: 500, color: '#cdd3dd' }}>2.4.1</b></span>
        <span style={{ margin: '0 14px', color: '#3a3f4b' }}>│</span>
        <span>REGION&nbsp;<b style={{ fontWeight: 500, color: '#cdd3dd' }}>US-EAST</b></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 18, color: '#9aa1ad' }}>
          <span>UPTIME&nbsp;<b style={{ fontWeight: 500, color: '#cdd3dd' }}>99.98%</b></span>
          <span>STATUS&nbsp;<b style={{ fontWeight: 500, color: '#4ade80' }}>OPERATIONAL</b></span>
        </div>
      </div>

      {/* main shell */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ── LEFT: blueprint pane ── */}
        <aside className="login-blueprint" style={{ minHeight: 0 }}>
          {/* brand */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <BrandMark variant="wordmark" size={34} />
          </div>

          {/* drawing canvas */}
          <div style={{ position: 'relative', zIndex: 2, flex: 1, marginTop: 42, marginBottom: 18, minHeight: 0 }}>
            <svg viewBox="0 0 720 420" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
              <g fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#6c7a99">
                <text x="20" y="92">A</text>
                <text x="20" y="182">B</text>
                <text x="20" y="272">C</text>
                <text x="20" y="362">D</text>
                <text x="100" y="32">1</text>
                <text x="220" y="32">2</text>
                <text x="340" y="32">3</text>
                <text x="460" y="32">4</text>
                <text x="580" y="32">5</text>
                <text x="680" y="32">6</text>
              </g>
              <g fill="none" stroke="#3a4763" strokeWidth="1">
                <circle cx="100" cy="50" r="10"/><circle cx="220" cy="50" r="10"/>
                <circle cx="340" cy="50" r="10"/><circle cx="460" cy="50" r="10"/>
                <circle cx="580" cy="50" r="10"/><circle cx="680" cy="50" r="10"/>
              </g>
              <g stroke="#2a3247" strokeWidth="1" strokeDasharray="3 4">
                <line x1="100" y1="60" x2="100" y2="380"/>
                <line x1="220" y1="60" x2="220" y2="380"/>
                <line x1="340" y1="60" x2="340" y2="380"/>
                <line x1="460" y1="60" x2="460" y2="380"/>
                <line x1="580" y1="60" x2="580" y2="380"/>
                <line x1="680" y1="60" x2="680" y2="380"/>
              </g>
              <g stroke="#9bb5e8" strokeWidth="1.6" strokeLinecap="round">
                <line className="draw-line"    x1="100" y1="90"  x2="680" y2="90"/>
                <line className="draw-line d2" x1="100" y1="180" x2="680" y2="180"/>
                <line className="draw-line d3" x1="100" y1="270" x2="680" y2="270"/>
                <line className="draw-line d4" x1="100" y1="360" x2="680" y2="360"/>
              </g>
              <g fill="#9bb5e8" opacity=".95">
                {[90,180,270,360].map(y => [100,220,340,460,580,680].map(x => (
                  <rect key={`${x}-${y}`} x={x-4} y={y-4} width="8" height="8"/>
                )))}
              </g>
              <g stroke="#6f8bbf" strokeWidth="1" strokeDasharray="2 3">
                <line x1="340" y1="180" x2="460" y2="270"/>
                <line x1="460" y1="180" x2="340" y2="270"/>
              </g>
              <g fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#6c7a99">
                <text x="155" y="84">B10 (W16x26)</text>
                <text x="395" y="84">B4 (W16x26)</text>
                <text x="155" y="174">B7 (W16x26)</text>
                <text x="535" y="174">B18 (W16x26)</text>
                <text x="395" y="354">B22 (W16x26)</text>
              </g>
              <g stroke="#3a4763" strokeWidth="1">
                <line x1="100" y1="395" x2="680" y2="395"/>
                <line x1="100" y1="390" x2="100" y2="400"/>
                <line x1="680" y1="390" x2="680" y2="400"/>
              </g>
              <text x="370" y="411" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#6c7a99">180&#39;-0&#34;</text>
              <ellipse cx="600" cy="90"  rx="30" ry="10" fill="none" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="3 3"/>
              <ellipse cx="460" cy="180" rx="30" ry="10" fill="none" stroke="#3b82f6" strokeWidth="1.3" strokeDasharray="3 3"/>
              <ellipse cx="520" cy="360" rx="34" ry="10" fill="none" stroke="#22c55e" strokeWidth="1.3" strokeDasharray="3 3"/>
            </svg>

            <div className="login-pin red"   style={{ top: '18%', left: '78%' }}>1</div>
            <div className="login-anno red"  style={{ top: '14%', left: '84%' }}>Corrosion at seat<br/>connection · field verify</div>
            <div className="login-pin blue"  style={{ top: '42%', left: '60%' }}>2</div>
            <div className="login-anno blue" style={{ top: '48%', left: '64%' }}>Paint peeling, rust scale<br/>check bottom flange</div>
            <div className="login-pin green" style={{ top: '80%', left: '67%' }}>3</div>
            <div className="login-anno green"style={{ top: '84%', left: '71%' }}>Section loss at midspan<br/>verify remaining thickness</div>
          </div>

          {/* tagline */}
          <div style={{ position: 'relative', zIndex: 2, marginBottom: 14, maxWidth: 520 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: '#5d6c8c', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 24, height: 1, background: '#3a4763', display: 'inline-block', flexShrink: 0 }}/>
              Field-to-office, in sync
            </div>
            <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500, color: '#e8eef9', fontSize: 30, lineHeight: 1.18, letterSpacing: '-.015em', margin: '0 0 12px' }}>
              Inspections, markups, and reports —<br/>
              <span style={{ color: '#9bb5e8', borderBottom: '1px dashed #4f6692', paddingBottom: 1 }}>on one structural canvas.</span>
            </h1>
            <p style={{ margin: 0, color: '#8a96b3', fontSize: 13.5, lineHeight: 1.55, maxWidth: 440 }}>
              Pin findings to gridlines. Link photos to beams. Push reports without leaving the drawing.
            </p>
          </div>

          {/* title block */}
          <div style={{ position: 'relative', zIndex: 2, border: '1px solid #2a3247', background: 'rgba(20,24,33,.6)', backdropFilter: 'blur(2px)', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: '.04em', color: '#aab8d4' }}>
            {[
              { label: 'Project', value: '1234 — Riverside Office' },
              { label: 'Sheet',   value: 'S-2.3 · Level 2 Plan' },
              { label: 'Scale',   value: '1/8" = 1\'-0"' },
            ].map((cell, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRight: i < 2 ? '1px solid #2a3247' : 'none' }}>
                <div style={{ textTransform: 'uppercase', color: '#6c7a99', fontSize: 9.5, marginBottom: 4, letterSpacing: '.12em' }}>{cell.label}</div>
                <div style={{ color: '#dbe2f1', fontWeight: 500 }}>{cell.value}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── RIGHT: form pane ── */}
        <section style={{
          position: 'relative', background: '#eef0f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 48px', overflowY: 'auto', colorScheme: 'light',
        }}>
          {/* subtle grid overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#d9dce4 1px,transparent 1px),linear-gradient(90deg,#d9dce4 1px,transparent 1px)', backgroundSize: '80px 80px', opacity: .35, pointerEvents: 'none' }} />

          {/* raised white card */}
          <div style={{
            width: '100%', maxWidth: 440, position: 'relative',
            background: '#ffffff', borderRadius: 12,
            border: '1px solid #dde0e8',
            boxShadow: '0 2px 8px rgba(0,0,0,.06), 0 8px 32px rgba(0,0,0,.10)',
            padding: '36px 36px 28px',
            colorScheme: 'light',
          }}>
            {/* blue top accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 3, background: 'linear-gradient(90deg,#2563eb,#3b82f6)', borderRadius: '0 0 3px 3px' }} />

            {/* sheet mark */}
            <div style={{ position: 'absolute', top: 14, right: 20, fontFamily: "'IBM Plex Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', color: '#b0b8c8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, border: '1px solid #d0d5df', display: 'inline-block' }}/>
              AUTH
            </div>

            {/* heading */}
            <div className="login-stagger" style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#8a94a8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>SimplifyStruct</span>
                <span style={{ background: '#f0f2f6', border: '1px solid #dde0e8', padding: '2px 7px', borderRadius: 3, fontSize: 10, color: '#374151' }}>v2.4</span>
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.2, color: '#0f1117' }}>
                {authMode === 'signin' ? 'Welcome back.' : authMode === 'create' ? 'Create your account.' : 'Reset your password.'}
              </h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
                {authMode === 'signin' && (
                  <>New here?{' '}
                    <a href="#" onClick={e => { e.preventDefault(); switchMode('create'); }} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Create an account →</a>
                  </>
                )}
                {authMode === 'create' && (
                  <>Already a user?{' '}
                    <a href="#" onClick={e => { e.preventDefault(); switchMode('signin'); }} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Sign in →</a>
                  </>
                )}
                {authMode === 'reset' && (
                  <>Enter your email and we'll send a reset link.{' '}
                    <a href="#" onClick={e => { e.preventDefault(); switchMode('signin'); }} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Back to sign in →</a>
                  </>
                )}
              </p>
            </div>

            {/* tabs (hidden in reset mode) */}
            {authMode !== 'reset' && (
            <div style={{ display: 'flex', background: '#f0f2f6', border: '1px solid #dde0e8', borderRadius: 7, padding: 3, marginBottom: 22 }}>
              {(['signin', 'create'] as Exclude<AuthMode, 'reset'>[]).map(m => (
                <button key={m} type="button" onClick={() => switchMode(m)} style={{
                  flex: 1, textAlign: 'center', padding: '8px 10px', fontSize: 13, fontWeight: 500,
                  color: authMode === m ? '#0f1117' : '#6b7280',
                  cursor: 'pointer', border: 'none', borderRadius: 5, fontFamily: 'inherit',
                  background: authMode === m ? '#ffffff' : 'transparent',
                  boxShadow: authMode === m ? '0 1px 3px rgba(0,0,0,.10)' : 'none',
                  transition: 'all .15s ease',
                }}>
                  {m === 'signin' ? 'Sign in' : 'Register'}
                </button>
              ))}
            </div>
            )}

            {!authConfigured && (
              <div style={{ marginBottom: 16, fontSize: 12, color: '#d97706', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '8px 12px' }}>
                Firebase is not configured yet. Add the Firebase environment variables in Vercel, then redeploy.
              </div>
            )}

            {errorMessage && (
              <div style={{ marginBottom: 16, fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px' }}>
                {errorMessage}
              </div>
            )}

            {resetSent && (
              <div style={{ marginBottom: 16, fontSize: 12, color: '#059669', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 6, padding: '8px 12px' }}>
                ✓ Reset link sent. Check your inbox (and spam folder).
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ colorScheme: 'light' }}>

              {/* register-only fields */}
              {authMode === 'create' && (
                <div className="login-stagger">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div style={fieldS}>
                      <label style={lblS}>First name <span style={hintS}>REQ</span></label>
                      <div style={ctrlS}>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={inpS} placeholder="Avery" autoComplete="given-name" required />
                      </div>
                    </div>
                    <div style={fieldS}>
                      <label style={lblS}>Last name <span style={hintS}>REQ</span></label>
                      <div style={ctrlS}>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={inpS} placeholder="Morgan" autoComplete="family-name" required />
                      </div>
                    </div>
                  </div>
                  <div style={fieldS}>
                    <label style={lblS}>Company <span style={hintS}>OPT</span></label>
                    <div style={ctrlS}>
                      <span style={iconWrap}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M13 9h.01M9 13h.01M13 13h.01M9 17h.01M13 17h.01"/>
                        </svg>
                      </span>
                      <input type="text" value={company} onChange={e => setCompany(e.target.value)} style={inpS} placeholder="Riverside Engineering, PC" />
                    </div>
                  </div>
                  <div style={fieldS}>
                    <label style={lblS}>Discipline</label>
                    <div style={ctrlS}>
                      <select value={discipline} onChange={e => setDiscipline(e.target.value)} className="login-select" style={{ ...inpS, flex: 1 }}>
                        <option>Structural</option><option>Architectural</option>
                        <option>MEP</option><option>Civil / Site</option>
                        <option>General Contractor</option><option>Inspector</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* email */}
              <div style={fieldS}>
                <label style={lblS}>Email <span style={hintS}>REQ</span></label>
                <div style={ctrlS}>
                  <span style={iconWrap}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
                    </svg>
                  </span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inpS} placeholder="you@firm.com" autoComplete="email" required />
                </div>
              </div>

              {/* password (hidden in reset mode) */}
              {authMode !== 'reset' && (
              <div style={fieldS}>
                <label style={lblS}>Password <span style={hintS}>8+ CHARS</span></label>
                <div style={ctrlS}>
                  <span style={iconWrap}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={inpS} placeholder="••••••••"
                    autoComplete={authMode === 'create' ? 'new-password' : 'current-password'}
                    minLength={6} required
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} aria-label="Show password"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 10px', color: '#9aa1ad', display: 'flex', alignItems: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {showPassword
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                        : <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>
                      }
                    </svg>
                  </button>
                </div>
                {authMode === 'create' && (
                  <>
                    <div className={`strength-s${pwStrength}`} style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      <i className="strength-bar"/><i className="strength-bar"/><i className="strength-bar"/><i className="strength-bar"/>
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#9aa1ad', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 4 }}>
                      STRENGTH · {strengthLabels[pwStrength]}
                    </div>
                  </>
                )}
              </div>
              )}

              {/* confirm password */}
              {authMode === 'create' && (
                <div style={fieldS}>
                  <label style={lblS}>Confirm Password</label>
                  <div style={ctrlS}>
                    <span style={iconWrap}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                      </svg>
                    </span>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inpS} placeholder="••••••••" autoComplete="new-password" minLength={6} required />
                  </div>
                </div>
              )}

              {/* tier picker */}
              {authMode === 'create' && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, marginBottom: 8 }}>Plan</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {([
                      { id: 'private' as Tier, name: 'Private', price: '$9/mo', storage: '1 GB', photos: '500' },
                      { id: 'pro' as Tier, name: 'Pro', price: '$29/mo', storage: '5 GB', photos: '2,500' },
                      { id: 'business' as Tier, name: 'Business', price: '$79/mo', storage: '20 GB', photos: '10,000' },
                    ] as const).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTier(t.id)}
                        style={{
                          border: selectedTier === t.id ? '2px solid #2563eb' : '1px solid #d6dae3',
                          borderRadius: 7, padding: '10px 8px', background: selectedTier === t.id ? '#eff6ff' : '#fff',
                          cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f1117', marginBottom: 2 }}>{t.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', marginBottom: 4 }}>{t.price}</div>
                        <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.5 }}>{t.storage}<br/>{t.photos} photos</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* invite code */}
              {authMode === 'create' && (
                <div style={fieldS}>
                  <label style={lblS}>Invite Code <span style={hintS}>REQ</span></label>
                  <div style={ctrlS}>
                    <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} style={inpS} placeholder="Enter invite code" autoComplete="off" required />
                  </div>
                </div>
              )}

              {/* meta row */}
              {authMode === 'signin' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <label className="login-check" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#374151', cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={keepSignedIn} onChange={e => setKeepSignedIn(e.target.checked)} />
                    Keep me signed in
                  </label>
                  <a href="#" onClick={e => { e.preventDefault(); switchMode('reset'); }} style={{ fontSize: 12.5, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
                </div>
              )}
              {authMode === 'create' && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
                  <label className="login-check" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#374151', cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" required />
                    I agree to the <a href="#" style={{ marginLeft: 4, color: '#2563eb', textDecoration: 'none' }}>Terms &amp; Privacy</a>
                  </label>
                </div>
              )}

              {/* submit */}
              <button type="submit" disabled={!authConfigured || isSubmitting} className="login-submit"
                style={{
                  width: '100%', background: isSubmitting ? '#374151' : '#0f1117', color: '#fff',
                  border: 'none', padding: '13px 16px', borderRadius: 8,
                  fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: !authConfigured ? 0.5 : 1,
                  boxShadow: '0 2px 8px rgba(15,17,23,.25)',
                }}
              >
                <span>
                  {isSubmitting
                    ? (authMode === 'create' ? 'Creating account…' : authMode === 'reset' ? 'Sending reset link…' : 'Authenticating…')
                    : (authMode === 'create' ? 'Create account' : authMode === 'reset' ? 'Send reset link' : 'Sign in to SimplifyStruct')}
                </span>
                {!isSubmitting && (
                  <svg className="login-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                )}
              </button>
            </form>

            {/* footer */}
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#b0b8c8', letterSpacing: '.1em', textTransform: 'uppercase' }}>
              <span>© 2026 SIMPLIFYSTRUCT</span>
              <span><a href="#" style={{ color: '#b0b8c8' }}>Privacy</a>{' · '}<a href="#" style={{ color: '#b0b8c8' }}>Terms</a>{' · '}<a href="#" style={{ color: '#b0b8c8' }}>Status</a></span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
