import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Users, FolderOpen, Search, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { subscribeProfile, type UserProfile } from '../lib/userProfile';
import { subscribeCompany, subscribeMembers, type Company, type CompanyMember } from '../lib/teamService';
import { subscribeAllCompanyProjects, type SharedProject } from '../lib/teamProjects';
import { colorForProject, stableIndexForId } from '../lib/projectColors';

const ACTIVE_PROJECT_KEY = 'struccalc.activeProject.v3';
const SESSION_MODE_KEY = 'struccalc.sessionMode.v3';

type StatusFilter = 'all' | 'Active' | 'On Hold' | 'Closed' | 'Archived';

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'Active':   return 'bg-green-900/40 text-green-400 border border-green-800/50';
    case 'On Hold':  return 'bg-amber-900/40 text-amber-400 border border-amber-800/50';
    default:         return 'bg-slate-700 text-slate-400 border border-slate-600';
  }
};

const fmt = (iso: string) => {
  try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso)); }
  catch { return iso; }
};

export const CompanyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => subscribeProfile(setProfile), []);

  useEffect(() => {
    if (!profile?.companyId) return;
    const unsub1 = subscribeCompany(profile.companyId, setCompany);
    const unsub2 = subscribeMembers(profile.companyId, setMembers);
    const unsub3 = subscribeAllCompanyProjects(profile.companyId, setProjects);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [profile?.companyId]);

  const openProject = (p: SharedProject) => {
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, p.id);
    window.localStorage.setItem(SESSION_MODE_KEY, 'project');
    navigate('/dashboard');
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects
      .filter(p => statusFilter === 'all' || p.status === statusFilter)
      .filter(p => !q ||
        [p.name, p.projectNumber, p.client, p.location, p.ownerEmail].join(' ').toLowerCase().includes(q),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, search, statusFilter]);

  // Gate page to Pro/Business users in a company
  if (!profile) {
    return <div className="p-8 text-slate-400 text-sm">Loading…</div>;
  }
  const isTeamUser = profile.companyId && (profile.tier === 'pro' || profile.tier === 'business');
  if (!isTeamUser) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <Building2 size={28} className="text-slate-600 mx-auto mb-3" />
        <div className="text-lg font-semibold text-slate-100 mb-1">Company is a Pro & Business feature</div>
        <div className="text-sm text-slate-400 mb-5">
          Upgrade your plan and create a company to share projects with your team.
        </div>
        <button
          onClick={() => navigate('/settings?tab=billing')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
        >
          View Plans
        </button>
      </div>
    );
  }

  const myMember = members.find(m => m.uid === user?.uid);
  const role = myMember?.role ?? profile.companyRole;
  const ownerCount = members.filter(m => m.role === 'owner').length;
  const managerCount = members.filter(m => m.role === 'manager').length;
  const employeeCount = members.filter(m => m.role === 'employee').length;
  const statusFilters: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'Active', label: 'Active' },
    { id: 'On Hold', label: 'On Hold' },
    { id: 'Closed', label: 'Closed' },
    { id: 'Archived', label: 'Archived' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-700 text-blue-400">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">{company?.name || 'Your Company'}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {company?.description || `Team workspace for ${company?.tier === 'business' ? 'Business' : 'Pro'} plan members.`}
            </p>
          </div>
        </div>
      </div>

      {/* Members + stats rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Members · {members.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {members.slice(0, 8).map(m => {
              const initials = (m.name || m.email).slice(0, 2).toUpperCase();
              return (
                <div key={m.id} title={`${m.email} (${m.role})`}
                  className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[11px] font-bold text-slate-200">
                  {initials}
                </div>
              );
            })}
            {members.length > 8 && (
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                +{members.length - 8}
              </div>
            )}
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            {ownerCount} owner{ownerCount === 1 ? '' : 's'} · {managerCount} manager{managerCount === 1 ? '' : 's'} · {employeeCount} employee{employeeCount === 1 ? '' : 's'}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={13} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projects · {projects.length}</span>
          </div>
          <div className="text-2xl font-bold text-slate-100">{projects.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {projects.filter(p => p.status === 'Active').length} active
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Role</span>
          </div>
          <div className="text-base font-semibold text-slate-100 capitalize">{role || 'Member'}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {role === 'owner' && 'Full access to all company settings'}
            {role === 'manager' && 'Manage projects and invite members'}
            {role === 'employee' && 'View team projects and contribute'}
          </div>
        </div>
      </div>

      {/* Projects grid */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">Team Projects</span>
            <span className="text-[10px] text-slate-500">{filtered.length} shown</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="w-52 bg-slate-800 border border-slate-700 rounded pl-7 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {statusFilters.map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                statusFilter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-10 text-center">
            <FolderOpen size={28} className="text-slate-700 mx-auto mb-2" />
            <div className="text-sm text-slate-500">
              {projects.length === 0
                ? 'No team projects yet. Projects shared with the company will appear here.'
                : 'No projects match your filters.'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(p => {
              const colorIdx = p.colorIndex !== undefined ? p.colorIndex : stableIndexForId(p.id);
              const chipColor = colorForProject(colorIdx).hex;
              const isMine = p.ownerUid === user?.uid;
              return (
                <button
                  key={p.id}
                  onClick={() => openProject(p)}
                  className="text-left bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-lg p-4 transition-colors group"
                >
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="w-[3px] self-stretch min-h-[40px] rounded-full shrink-0" style={{ background: chipColor }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-100 truncate">{p.name}</span>
                        {isMine && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-600/10 border border-blue-500/30 px-1.5 py-0.5 rounded shrink-0">
                            Yours
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.projectNumber || '—'}</div>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {p.client && <div className="text-[11px] text-slate-400 truncate">{p.client}</div>}
                    {p.location && <div className="text-[11px] text-slate-500 truncate">{p.location}</div>}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/60">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Calendar size={10} />
                      {fmt(p.updatedAt)}
                    </div>
                  </div>

                  {!isMine && p.ownerEmail && (
                    <div className="mt-2 text-[10px] text-slate-500 truncate">by {p.ownerEmail}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
