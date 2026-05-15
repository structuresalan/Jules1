import React, { useEffect, useState } from 'react';
import { Monitor, Palette, Sparkles, SlidersHorizontal, User, Users, CreditCard, HardDrive, Image, Zap } from 'lucide-react';
import { type WebsiteAccent, type WebsiteDensity, type WebsiteStyle, useWebsiteStyleSettings } from '../utils/websiteStyle';
import { subscribeProfile, formatBytes, getEffectiveLimits, redeemPromoCode, TIER_LIMITS, type UserProfile, type Tier } from '../lib/userProfile';

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
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('appearance');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => subscribeProfile(setProfile), []);

  const handleRedeem = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoStatus(null);
    const result = await redeemPromoCode(promoInput.trim());
    setPromoStatus({ ok: result.success, msg: result.message });
    if (result.success) setPromoInput('');
    setPromoLoading(false);
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
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 min-h-48 text-center">
          <User size={28} className="text-slate-600" />
          <div className="text-slate-400 font-medium">Account settings coming soon</div>
          <div className="text-sm text-slate-600 max-w-xs">Manage your profile, email, and password here in an upcoming release.</div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 min-h-48 text-center">
          <Users size={28} className="text-slate-600" />
          <div className="text-slate-400 font-medium">Team management coming soon</div>
          <div className="text-sm text-slate-600 max-w-xs">Invite collaborators, manage roles, and share projects with your team.</div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-4">
          {/* Current plan */}
          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Current Plan</div>
            {profile ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-semibold capitalize text-sm">{profile.tier}</span>
                    {profile.promoActive && (
                      <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Promo Active</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {profile.promoActive ? 'All limits removed' : `${formatBytes(TIER_LIMITS[profile.tier as Tier].bytes)} storage · ${TIER_LIMITS[profile.tier as Tier].photoCount.toLocaleString()} photos`}
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['starter', 'pro', 'business'] as Tier[]).map(t => (
                    <div key={t} className={`text-[10px] px-2 py-1 rounded border font-medium capitalize ${profile.tier === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>{t}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Loading…</div>
            )}
          </div>

          {/* Storage usage */}
          {profile && (() => {
            const limits = getEffectiveLimits(profile);
            const storagePct = Math.min(100, (profile.storageUsedBytes / limits.bytes) * 100);
            const photoPct = Math.min(100, (profile.photoCount / limits.photoCount) * 100);
            return (
              <div className="bg-slate-800 border border-slate-700 rounded p-5 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Usage</div>
                {/* Storage bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300"><HardDrive size={12} className="text-blue-400"/>Storage</div>
                    <span className="text-[10px] text-slate-400">{formatBytes(profile.storageUsedBytes)} / {profile.promoActive ? '∞' : formatBytes(limits.bytes)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${storagePct > 90 ? 'bg-red-500' : storagePct > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${profile.promoActive ? 0 : storagePct}%` }}/>
                  </div>
                </div>
                {/* Photos bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300"><Image size={12} className="text-blue-400"/>Photos</div>
                    <span className="text-[10px] text-slate-400">{profile.photoCount.toLocaleString()} / {profile.promoActive ? '∞' : limits.photoCount.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${photoPct > 90 ? 'bg-red-500' : photoPct > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${profile.promoActive ? 0 : photoPct}%` }}/>
                  </div>
                </div>
                {/* Uploads today */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300"><Zap size={12} className="text-blue-400"/>Uploads today</div>
                  <span className="text-slate-400">{profile.uploadsToday} / {profile.promoActive ? '∞' : limits.uploadsPerDay}</span>
                </div>
              </div>
            );
          })()}

          {/* Promo code */}
          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Promo Code</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={e => setPromoInput(e.target.value)}
                placeholder="Enter 10-digit code"
                maxLength={10}
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500"
              />
              <button
                onClick={handleRedeem}
                disabled={promoLoading || !promoInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                {promoLoading ? '…' : 'Redeem'}
              </button>
            </div>
            {promoStatus && (
              <div className={`mt-2 text-xs px-3 py-2 rounded border ${promoStatus.ok ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {promoStatus.msg}
              </div>
            )}
          </div>

          {/* Tier cards */}
          <div className="bg-slate-800 border border-slate-700 rounded p-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Plans</div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: 'starter' as Tier, name: 'Starter', price: 'Free', storage: '1 GB', photos: '500', uploads: '50/day' },
                { id: 'pro' as Tier, name: 'Pro', price: '$29/mo', storage: '5 GB', photos: '2,500', uploads: '200/day' },
                { id: 'business' as Tier, name: 'Business', price: '$79/mo', storage: '20 GB', photos: '10,000', uploads: '1,000/day' },
              ] as const).map(t => {
                const active = profile?.tier === t.id;
                return (
                  <div key={t.id} className={`rounded border p-4 ${active ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-900'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-100">{t.name}</span>
                      {active && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">Current</span>}
                    </div>
                    <div className="text-blue-400 font-bold text-sm mb-3">{t.price}</div>
                    <div className="space-y-1 text-[10px] text-slate-400 mb-4">
                      <div>{t.storage} storage</div>
                      <div>{t.photos} photos</div>
                      <div>{t.uploads}</div>
                    </div>
                    {!active && (
                      <button className="w-full text-[10px] font-bold uppercase tracking-wider border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 rounded px-2 py-1.5 transition-colors">
                        Upgrade
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-[10px] text-slate-600 text-center">Payment integration coming soon. Use a promo code to unlock all limits during testing.</div>
          </div>
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
