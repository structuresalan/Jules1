import React, { useState, useEffect } from 'react';
import { Monitor, Palette, Sparkles, SlidersHorizontal, User, Users, CreditCard, Save, UserPlus, Trash2, Shield, HardDrive, Image, Zap, Building2, Check, X } from 'lucide-react';
import { type WebsiteAccent, type WebsiteDensity, type WebsiteStyle, useWebsiteStyleSettings } from '../utils/websiteStyle';
import { updateAccountInfo, updateCompanyInfo, subscribeProfile, formatBytes, getEffectiveLimits, redeemPromoCode, TIER_LIMITS } from '../lib/userProfile';
import type { UserProfile, Tier } from '../lib/userProfile';
import {
  createCompany, subscribeCompany, subscribeMembers, inviteMember,
  removeMember, updateMemberRole, checkPendingInvite, acceptInvite, declineInvite,
  TEAM_SIZE_LIMITS,
} from '../lib/teamService';
import type { Company, CompanyMember, CompanyRole, CompanyInvite } from '../lib/teamService';
import { auth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from '../firebase';

const styleOptions: Array<{
  value: WebsiteStyle;
  title: string;
  description: string;
}> = [
  {
    value: 'classic',
    title: 'Classic',
    description: 'Clean light interface with the original SimplifyStruct feel.',
  },
  {
    value: 'desktop-dark',
    title: 'Desktop Dark',
    description: 'Dark app shell with solid desktop-style panels.',
  },
  {
    value: 'desktop-glass',
    title: 'Desktop Dark + Glass',
    description: 'Premium Fireflies-style dark glass, glow, and desktop-window panels.',
  },
];

const accentOptions: Array<{ value: WebsiteAccent; title: string }> = [
  { value: 'blue', title: 'Blue' },
  { value: 'purple', title: 'Purple' },
  { value: 'slate', title: 'Slate' },
];

const densityOptions: Array<{ value: WebsiteDensity; title: string }> = [
  { value: 'comfortable', title: 'Comfortable' },
  { value: 'compact', title: 'Compact' },
];

type SettingsTab = 'appearance' | 'account' | 'team' | 'billing';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useWebsiteStyleSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => subscribeProfile(setProfile), []);

  // Account tab state
  const [discipline, setDiscipline] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Billing tab state
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Company state
  const [company, setCompany] = useState<Company | null>(null);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [pendingInvite, setPendingInvite] = useState<CompanyInvite | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'employee'>('employee');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [acceptingInvite, setAcceptingInvite] = useState(false);

  // Payment/upgrade state
  const [paymentStatus, setPaymentStatus] = useState<'' | 'verifying' | 'success' | 'failed' | 'cancelled'>('');
  const [upgrading, setUpgrading] = useState<string>('');

  // Read ?tab= from URL on mount and set activeTab accordingly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'team' || tab === 'billing' || tab === 'account' || tab === 'appearance') {
      setActiveTab(tab as typeof activeTab);
    }
  }, []);

  // Handle Stripe return — verify session and update tier
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const cancelled = params.get('cancelled');

    if (cancelled) {
      setPaymentStatus('cancelled');
      window.history.replaceState({}, '', '/settings?tab=billing');
      return;
    }
    if (!sessionId) return;

    setPaymentStatus('verifying');
    fetch(`/api/verify-subscription?session_id=${sessionId}`)
      .then(r => r.json())
      .then(async (data) => {
        if (data.paid && data.tier) {
          const { auth: a, db: d } = await import('../firebase');
          const { doc, setDoc } = await import('firebase/firestore');
          if (a?.currentUser && d) {
            await setDoc(
              doc(d, 'users', a.currentUser.uid, 'profile', 'main'),
              { tier: data.tier },
              { merge: true }
            );
            // If user owns a company, propagate Pro/Business tier to the company too
            if (profile?.companyId && profile.companyRole === 'owner' && (data.tier === 'pro' || data.tier === 'business')) {
              const { updateCompanyTier } = await import('../lib/teamService');
              await updateCompanyTier(profile.companyId, data.tier);
            }
          }
          setPaymentStatus('success');
        } else {
          setPaymentStatus('failed');
        }
        window.history.replaceState({}, '', '/settings?tab=billing');
        setTimeout(() => setPaymentStatus(''), 5000);
      })
      .catch(() => {
        setPaymentStatus('failed');
        setTimeout(() => setPaymentStatus(''), 5000);
      });
  }, []);

  // Sync discipline from profile
  useEffect(() => {
    if (profile?.discipline !== undefined) setDiscipline(profile.discipline ?? '');
  }, [profile?.discipline]);

  // Subscribe to company if user has one
  useEffect(() => {
    const companyId = profile?.companyId;
    if (!companyId) {
      setCompany(null);
      setCompanyMembers([]);
      return;
    }
    const unsub1 = subscribeCompany(companyId, setCompany);
    const unsub2 = subscribeMembers(companyId, setCompanyMembers);
    return () => { unsub1(); unsub2(); };
  }, [profile?.companyId]);

  // Check for pending invite when signed in
  useEffect(() => {
    if (!auth?.currentUser) return;
    checkPendingInvite().then(setPendingInvite);
  }, [auth?.currentUser?.uid]);

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    await updateAccountInfo({ discipline });
    setSavingAccount(false);
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 2000);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    const user = auth?.currentUser;
    if (!user || !user.email) { setPasswordError('Not signed in.'); return; }
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordSuccess('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setPasswordError(msg.includes('wrong-password') || msg.includes('invalid-credential') ? 'Current password is incorrect.' : 'Failed to update password.');
    }
    setSavingPassword(false);
  };

  const handleRedeem = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoStatus('');
    const result = await redeemPromoCode(promoInput.trim());
    setPromoStatus(result.message);
    setPromoLoading(false);
  };

  const handleCreateCompany = async () => {
    if (!companyName.trim()) return;
    if (profile?.tier !== 'pro' && profile?.tier !== 'business') return;
    setCreatingCompany(true);
    try {
      const co = await createCompany(companyName, companyDesc, profile.tier);
      await updateCompanyInfo(co.id, 'owner');
    } catch { /* ok */ }
    setCreatingCompany(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !company) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) { setInviteError('Invalid email.'); return; }
    setInviting(true);
    setInviteError('');
    try {
      await inviteMember(company.id, company.name, inviteEmail, inviteRole);
      setInviteEmail('');
    } catch (e: unknown) {
      setInviteError(e instanceof Error ? e.message : 'Failed to invite');
    }
    setInviting(false);
  };

  const handleAcceptInvite = async () => {
    if (!pendingInvite) return;
    setAcceptingInvite(true);
    const result = await acceptInvite(pendingInvite);
    await updateCompanyInfo(pendingInvite.companyId, pendingInvite.role);
    // Match the company's tier so invitee gets the same plan abilities
    if (result?.tier && auth?.currentUser) {
      const { db } = await import('../firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      if (db) {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'profile', 'main'), { tier: result.tier }, { merge: true });
      }
    }
    setPendingInvite(null);
    setAcceptingInvite(false);
  };

  const handleDeclineInvite = async () => {
    if (!pendingInvite) return;
    await declineInvite(pendingInvite.id);
    setPendingInvite(null);
  };

  const handleUpgrade = async (tier: Tier) => {
    if (tier === 'lite') return; // Free tier — no Stripe checkout needed.
    if (!auth?.currentUser?.email) return;
    setUpgrading(tier);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          origin: window.location.origin,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setUpgrading('');
      }
    } catch {
      setUpgrading('');
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
    { id: 'account', label: 'Account', icon: <User size={15} /> },
    { id: 'team', label: 'Team', icon: <Users size={15} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={15} /> },
  ];

  const effectiveLimits = profile ? getEffectiveLimits(profile) : TIER_LIMITS.lite;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-700 text-blue-400">
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">
              Settings
            </h1>
            <p className="mt-2 text-slate-400">
              Manage your account, team, and workspace preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-700 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Account tab */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Profile</div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Discipline</label>
                <input
                  value={discipline}
                  onChange={e => setDiscipline(e.target.value)}
                  placeholder="Structural Engineer"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSaveAccount}
                disabled={savingAccount}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
              >
                <Save size={12} />
                {accountSaved ? 'Saved!' : savingAccount ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-slate-400" />
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Change Password</div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                />
              </div>
              {passwordError && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{passwordError}</div>}
              {passwordSuccess && <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-3 py-2">{passwordSuccess}</div>}
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
              >
                <Shield size={12} />
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team tab */}
      {activeTab === 'team' && (profile?.tier === 'lite' || profile?.tier === 'private') && !profile?.companyId && !pendingInvite && (
        <div className="bg-slate-800 border border-slate-700 rounded p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Users size={22} className="text-blue-400" />
            </div>
          </div>
          <div className="text-lg font-semibold text-slate-100 mb-1">Teams is a Pro & Business feature</div>
          <div className="text-sm text-slate-400 max-w-sm mx-auto mb-5">
            Upgrade your plan to create a company, invite teammates, and assign roles.
          </div>
          <button
            onClick={() => setActiveTab('billing')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
          >
            <CreditCard size={13} />
            View Plans
          </button>
        </div>
      )}

      {activeTab === 'team' && ((profile?.tier !== 'lite' && profile?.tier !== 'private') || profile?.companyId || pendingInvite) && (
        <div className="space-y-4">

          {/* Pending invite banner */}
          {pendingInvite && !profile?.companyId && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">Company Invitation</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-100">{pendingInvite.companyName}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    You've been invited as <span className="capitalize text-slate-300 font-medium">{pendingInvite.role}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeclineInvite}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded transition-colors"
                  >
                    <X size={12} /> Decline
                  </button>
                  <button
                    onClick={handleAcceptInvite}
                    disabled={acceptingInvite}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
                  >
                    <Check size={12} /> {acceptingInvite ? 'Joining…' : 'Accept & Join'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No company yet */}
          {!profile?.companyId && !pendingInvite && (
            <div className="bg-slate-800 border border-slate-700 rounded p-5">
              <div className="flex items-center gap-3 mb-4">
                <Building2 size={18} className="text-blue-400" />
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Create Your Company</div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Company Name</label>
                  <input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Riverside Engineering, PC"
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Description <span className="text-slate-600 normal-case font-normal">optional</span></label>
                  <input
                    value={companyDesc}
                    onChange={e => setCompanyDesc(e.target.value)}
                    placeholder="Structural engineering consultancy"
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleCreateCompany}
                  disabled={creatingCompany || !companyName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
                >
                  <Building2 size={13} />
                  {creatingCompany ? 'Creating…' : 'Create Company'}
                </button>
                <div className="text-[10px] text-slate-600 pt-1">Already part of a company? Ask your CEO or a Manager to invite you by email.</div>
              </div>
            </div>
          )}

          {/* Company exists */}
          {profile?.companyId && company && (
            <>
              {/* Company header */}
              <div className="bg-slate-800 border border-slate-700 rounded p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                      <Building2 size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{company.name}</div>
                      {company.description && <div className="text-xs text-slate-500 mt-0.5">{company.description}</div>}
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    profile.companyRole === 'owner' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    profile.companyRole === 'manager' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                    'bg-slate-700 text-slate-400 border-slate-600'
                  }`}>
                    {profile.companyRole}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700 flex gap-4 text-[10px] text-slate-500">
                  <span>{companyMembers.filter(m => m.status === 'active').length} active members</span>
                  <span>{companyMembers.filter(m => m.status === 'pending').length} pending invites</span>
                  <span className="ml-auto">
                    {companyMembers.length} / {company.tier === 'business' ? '∞' : TEAM_SIZE_LIMITS[company.tier]} seats
                    <span className="ml-2 capitalize text-blue-400 font-medium">{company.tier} plan</span>
                  </span>
                </div>
              </div>

              {/* Invite (owner + manager only) */}
              {(profile.companyRole === 'owner' || profile.companyRole === 'manager') && (() => {
                const seatsUsed = companyMembers.length;
                const seatLimit = TEAM_SIZE_LIMITS[company.tier];
                const atLimit = seatsUsed >= seatLimit;
                return (
                <div className="bg-slate-800 border border-slate-700 rounded p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Invite Employee</div>
                    {atLimit && (
                      <div className="text-[10px] text-amber-400">
                        {company.tier === 'pro' ? 'Pro limit reached · Upgrade to Business for unlimited' : 'At capacity'}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleInvite()}
                      placeholder="colleague@firm.com"
                      className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                    />
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value as 'manager' | 'employee')}
                      className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                    >
                      <option value="employee">Employee</option>
                      {profile.companyRole === 'owner' && <option value="manager">Manager</option>}
                    </select>
                    <button
                      onClick={handleInvite}
                      disabled={inviting || !inviteEmail.trim() || atLimit}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors whitespace-nowrap"
                    >
                      <UserPlus size={13} />
                      {inviting ? '…' : 'Invite'}
                    </button>
                  </div>
                  {inviteError && <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{inviteError}</div>}
                  {atLimit && company.tier === 'pro' && (
                    <button
                      onClick={() => setActiveTab('billing')}
                      className="mt-3 w-full text-xs text-blue-400 hover:text-blue-300 font-medium border border-blue-500/30 bg-blue-500/10 rounded px-3 py-2 transition-colors"
                    >
                      Upgrade to Business →
                    </button>
                  )}
                </div>
                );
              })()}

              {/* Member list */}
              <div className="bg-slate-800 border border-slate-700 rounded p-5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Team</div>
                <div className="space-y-2">
                  {companyMembers
                    .sort((a, b) => {
                      const order: Record<CompanyRole, number> = { owner: 0, manager: 1, employee: 2 };
                      return order[a.role] - order[b.role];
                    })
                    .map(m => (
                      <div key={m.id} className="flex items-center justify-between py-2.5 px-3 bg-slate-900 rounded border border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            m.role === 'owner' ? 'bg-amber-600/30 text-amber-400' :
                            m.role === 'manager' ? 'bg-purple-600/30 text-purple-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {m.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm text-slate-200">{m.email}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${m.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`}/>
                              {m.status === 'pending' ? 'Invite pending' : 'Active'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Role badge / dropdown for owner */}
                          {m.role === 'owner' ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">Owner</span>
                          ) : profile.companyRole === 'owner' ? (
                            <select
                              value={m.role}
                              onChange={e => updateMemberRole(company.id, m.id, e.target.value as CompanyRole)}
                              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 outline-none focus:border-blue-500"
                            >
                              <option value="employee">Employee</option>
                              <option value="manager">Manager</option>
                            </select>
                          ) : (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              m.role === 'manager' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'
                            }`}>{m.role}</span>
                          )}
                          {/* Remove button — owner can remove anyone except self, manager can remove employees */}
                          {m.role !== 'owner' && (profile.companyRole === 'owner' || (profile.companyRole === 'manager' && m.role === 'employee')) && (
                            <button
                              onClick={() => removeMember(company.id, m.id)}
                              className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* Billing tab */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {paymentStatus === 'verifying' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4 text-sm text-blue-300">
              Verifying your payment…
            </div>
          )}
          {paymentStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-4 text-sm text-green-300">
              ✓ Subscription activated! Your new plan is now in effect.
            </div>
          )}
          {paymentStatus === 'cancelled' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-4 text-sm text-amber-300">
              Payment cancelled. You haven't been charged.
            </div>
          )}
          {paymentStatus === 'failed' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-4 text-sm text-red-300">
              Could not verify payment. If you were charged, please contact support.
            </div>
          )}
          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Current Plan</div>
            {profile && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-blue-400" />
                    <span className="text-sm font-semibold text-slate-100 capitalize">{profile.tier}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-900 rounded border border-slate-700 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <HardDrive size={11} className="text-slate-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Storage</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200">{formatBytes(profile.storageUsedBytes)}</div>
                    <div className="text-[10px] text-slate-500">of {formatBytes(effectiveLimits.bytes)}</div>
                    <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (profile.storageUsedBytes / effectiveLimits.bytes) * 100).toFixed(1)}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-slate-900 rounded border border-slate-700 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Image size={11} className="text-slate-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Photos</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200">{profile.photoCount.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">of {effectiveLimits.photoCount.toLocaleString()}</div>
                    <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (profile.photoCount / effectiveLimits.photoCount) * 100).toFixed(1)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 rounded border border-slate-700 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap size={11} className="text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Uploads</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">{profile.uploadsToday} <span className="text-slate-500 text-xs font-normal">today</span></div>
                  <div className="text-[10px] text-slate-500">limit: {effectiveLimits.uploadsPerDay}/day</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Plans</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(TIER_LIMITS) as Tier[]).map(tier => (
                <div
                  key={tier}
                  className={`rounded border px-4 py-3 ${profile?.tier === tier ? 'bg-blue-600/10 border-blue-500/40' : 'bg-slate-900 border-slate-700'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-100 capitalize">{tier}</span>
                    {profile?.tier === tier && <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Current</span>}
                  </div>
                  <div className="text-[11px] font-semibold text-blue-400 mb-1">
                    {tier === 'lite' ? 'Free' : tier === 'private' ? '$9/mo' : tier === 'pro' ? '$29/mo' : '$79/mo'}
                  </div>
                  {tier === 'private' && (
                    <div className="text-[9px] font-bold uppercase tracking-wider text-green-400 mb-2">
                      30-day free trial
                    </div>
                  )}
                  <div className="space-y-1 text-[10px] text-slate-500">
                    <div>{formatBytes(TIER_LIMITS[tier].bytes)} storage</div>
                    <div>{TIER_LIMITS[tier].photoCount.toLocaleString()} photos</div>
                    <div>{TIER_LIMITS[tier].uploadsPerDay}/day uploads</div>
                  </div>
                  {profile?.tier !== tier && tier !== 'lite' && (
                    <button
                      onClick={() => handleUpgrade(tier)}
                      disabled={upgrading === tier}
                      className="w-full mt-3 text-[10px] font-bold uppercase tracking-wider border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed rounded px-2 py-1.5 transition-colors"
                    >
                      {upgrading === tier ? 'Redirecting…' : 'Upgrade'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Promo Code</div>
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={e => setPromoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                placeholder="Enter code"
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
              />
              <button
                onClick={handleRedeem}
                disabled={promoLoading || !promoInput.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
              >
                {promoLoading ? '…' : 'Redeem'}
              </button>
            </div>
            {promoStatus && <div className="mt-2 text-xs text-slate-400">{promoStatus}</div>}
          </div>
        </div>
      )}

      {/* Appearance tab */}
      {activeTab === 'appearance' && <>
        <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <Sparkles className="text-blue-400" size={22} />
            <div>
              <h2 className="text-xl font-bold text-slate-100">Website Style</h2>
              <p className="text-sm text-slate-400">
                Pick the overall interface style. The dark glass option is inspired by premium desktop apps.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {styleOptions.map((option) => {
              const active = settings.style === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => updateSettings({ style: option.value })}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                      <Monitor size={20} />
                    </div>
                    {active && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                  <h3 className="font-bold text-slate-100">{option.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{option.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <Palette className="text-blue-400" size={22} />
            <div>
              <h2 className="text-xl font-bold text-slate-100">Accent &amp; Density</h2>
              <p className="text-sm text-slate-400">Fine tune the app feel.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Accent Color</h3>
              <div className="flex flex-wrap gap-2">
                {accentOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateSettings({ accent: option.value })}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      settings.accent === option.value
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {option.title}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Density</h3>
              <div className="flex flex-wrap gap-2">
                {densityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateSettings({ density: option.value })}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      settings.density === option.value
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {option.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-slate-800 border border-slate-700 rounded-xl">
          <div className="border-b border-slate-700 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-100">Preview</h2>
            <p className="mt-1 text-sm text-slate-400">
              The selected style is applied immediately across the app.
            </p>
          </div>
          <div className="relative p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-amber-500/10" />
            <div className="relative mx-auto max-w-3xl rounded-[2rem] border border-slate-600 bg-slate-900/50 p-5 shadow-2xl">
              <div className="mb-8 flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-300" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto flex w-fit gap-3 rounded-3xl border border-slate-600 bg-slate-700/50 p-3">
                {['Steel', 'Docs', 'Map', 'Review', 'Print'].map((label) => (
                  <div key={label} className="rounded-2xl bg-black/40 px-4 py-3 text-sm font-bold text-white shadow">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </>}
    </div>
  );
};
