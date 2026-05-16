import React, { useState, useEffect } from 'react';
import { Monitor, Palette, Sparkles, SlidersHorizontal, User, Users, CreditCard, Save, UserPlus, Trash2, Shield } from 'lucide-react';
import { type WebsiteAccent, type WebsiteDensity, type WebsiteStyle, useWebsiteStyleSettings } from '../utils/websiteStyle';
import { updateAccountInfo, subscribeProfile } from '../lib/userProfile';
import type { UserProfile } from '../lib/userProfile';
import { subscribeTeam, inviteMember, removeMember, updateMemberRole } from '../lib/teamService';
import type { TeamMember, TeamRole } from '../lib/teamService';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Account tab state
  const [acctName, setAcctName] = useState('');
  const [acctCompany, setAcctCompany] = useState('');
  const [acctDiscipline, setAcctDiscipline] = useState('Structural');
  const [acctSaving, setAcctSaving] = useState(false);
  const [acctSaved, setAcctSaved] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // Teams tab state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => subscribeProfile(setProfile), []);
  useEffect(() => subscribeTeam(setTeamMembers), []);

  useEffect(() => {
    if (profile?.displayName) setAcctName(profile.displayName);
    if (profile?.company) setAcctCompany(profile.company);
    if (profile?.discipline) setAcctDiscipline(profile.discipline);
  }, [profile]);

  const handleSaveAccount = async () => {
    setAcctSaving(true);
    await updateAccountInfo({ displayName: acctName, company: acctCompany, discipline: acctDiscipline });
    setAcctSaving(false);
    setAcctSaved(true);
    setTimeout(() => setAcctSaved(false), 2000);
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match.'); return; }
    if (pwNew.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    const user = auth?.currentUser;
    if (!user || !user.email) { setPwError('Not signed in.'); return; }
    setPwSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, pwCurrent);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, pwNew);
      setPwSaved(true);
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
      setTimeout(() => setPwSaved(false), 2000);
    } catch {
      setPwError('Current password is incorrect.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) { setInviteError('Invalid email.'); return; }
    setInviting(true);
    setInviteError('');
    await inviteMember(inviteEmail, inviteRole);
    setInviteEmail('');
    setInviting(false);
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
    { id: 'account', label: 'Account', icon: <User size={15} /> },
    { id: 'team', label: 'Team', icon: <Users size={15} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={15} /> },
  ];

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

      {activeTab === 'account' && (
        <div className="space-y-4">
          {/* Profile info */}
          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Profile</div>
            <div className="space-y-3">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg select-none">
                  {acctName ? acctName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : (auth?.currentUser?.email?.[0] ?? '?').toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">{acctName || 'No name set'}</div>
                  <div className="text-xs text-slate-500">{auth?.currentUser?.email}</div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Full Name</label>
                <input
                  value={acctName}
                  onChange={e => setAcctName(e.target.value)}
                  placeholder="Avery Morgan"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Company</label>
                <input
                  value={acctCompany}
                  onChange={e => setAcctCompany(e.target.value)}
                  placeholder="Riverside Engineering, PC"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Discipline</label>
                <select
                  value={acctDiscipline}
                  onChange={e => setAcctDiscipline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                >
                  <option>Structural</option>
                  <option>Architectural</option>
                  <option>MEP</option>
                  <option>Civil / Site</option>
                  <option>General Contractor</option>
                  <option>Inspector</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Email</label>
                <input
                  value={auth?.currentUser?.email ?? ''}
                  disabled
                  className="w-full bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-500 outline-none cursor-not-allowed"
                />
              </div>
              <button
                onClick={handleSaveAccount}
                disabled={acctSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
              >
                <Save size={13} />
                {acctSaved ? 'Saved!' : acctSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Change Password</div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={pwCurrent}
                  onChange={e => setPwCurrent(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">New Password</label>
                <input
                  type="password"
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
                />
              </div>
              {pwError && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{pwError}</div>}
              <button
                onClick={handleChangePassword}
                disabled={pwSaving || !pwCurrent || !pwNew || !pwConfirm}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
              >
                <Shield size={13} />
                {pwSaved ? 'Password Updated!' : pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-4">
          {/* Invite */}
          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Invite Member</div>
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
                onChange={e => setInviteRole(e.target.value as TeamRole)}
                className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
              >
                <UserPlus size={13} />
                {inviting ? '…' : 'Invite'}
              </button>
            </div>
            {inviteError && <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{inviteError}</div>}
          </div>

          {/* Member list */}
          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Members</div>
            <div className="space-y-2">
              {/* Owner row (current user) */}
              <div className="flex items-center justify-between py-2.5 px-3 bg-slate-900 rounded border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {(auth?.currentUser?.email?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm text-slate-200">{auth?.currentUser?.email}</div>
                    <div className="text-[10px] text-slate-500">You</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">Owner</span>
              </div>

              {teamMembers.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-sm">No team members yet. Invite someone above.</div>
              )}

              {teamMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2.5 px-3 bg-slate-900 rounded border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">
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
                    <select
                      value={m.role}
                      onChange={e => updateMemberRole(m.id, e.target.value as TeamRole)}
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 outline-none focus:border-blue-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => removeMember(m.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 min-h-48 text-center">
          <CreditCard size={28} className="text-slate-600" />
          <div className="text-slate-400 font-medium">Billing coming soon</div>
          <div className="text-sm text-slate-600 max-w-xs">Subscription plans, invoices, and payment methods will appear here.</div>
        </div>
      )}

      {activeTab === 'appearance' && <><section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
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
      </section></>}
    </div>
  );
};
