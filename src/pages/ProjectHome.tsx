import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calculator, FileText, FolderOpen, LogOut, MoreHorizontal, Plus, Save, Search, Settings as SettingsIcon, Trash2, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../hooks/useAuth';
import { colorForProject, stableIndexForId } from '../lib/projectColors';
import { useCollection } from '../lib/useCollection';
import { COLLECTIONS } from '../lib/db';
import { subscribeProfile, type UserProfile } from '../lib/userProfile';
import { subscribeTeamProjects, type SharedProject } from '../lib/teamProjects';
import { subscribeCompany, subscribeMembers, type Company, type CompanyMember } from '../lib/teamService';
import { auth } from '../firebase';
import { ArrowRight } from 'lucide-react';

type ProjectStatus = 'Active' | 'On Hold' | 'Closed' | 'Archived';
type ProjectType = 'New Construction' | 'Renovation' | 'Inspection' | 'Mixed';

interface ProjectRecord {
  id: string;
  name: string;
  projectNumber: string;
  client: string;
  location: string;
  description: string;
  status: ProjectStatus;
  projectType: ProjectType;
  createdAt: string;
  updatedAt: string;
  predictedEndDate?: string;
  colorIndex?: number;
  ownerUid?: string;
  ownerEmail?: string;
  companyId?: string;
  visibility?: 'private' | 'team';
  _shared?: boolean; // UI-only flag set when this row came from team query
}

const ACTIVE_PROJECT_KEY = 'struccalc.activeProject.v3';
const SESSION_MODE_KEY = 'struccalc.sessionMode.v3';

const makeProjectId = () => `project_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const formatDateTime = (isoDate: string) => {
  if (!isoDate) return '-';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
};

// ── Section card ────────────────────────────────────────────────────────────

const ProjectGroup: React.FC<{
  label: string;
  count: number;
  shared?: boolean;
  meta?: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}> = ({ label, count, shared, meta, action, children }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3 mb-2 px-1 flex-wrap">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label} · {count}
        </span>
        {shared && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 rounded">
            Shared
          </span>
        )}
        {meta && <span className="text-[11px] text-slate-500">{meta}</span>}
      </div>
      {action && (
        <button onClick={action.onClick} className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors">
          {action.label} <ArrowRight size={11} />
        </button>
      )}
    </div>
    <div className="bg-slate-800 rounded-lg overflow-hidden">{children}</div>
  </div>
);

const EmptyRow: React.FC<{ message: string }> = ({ message }) => (
  <div className="px-4 py-12 text-center text-xs text-slate-500">
    <FolderOpen size={20} className="mx-auto mb-2 text-slate-700" />
    {message}
  </div>
);

export const ProjectHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { items: projects, save: rawSaveProject, remove: removeProject } = useCollection<ProjectRecord>(
    COLLECTIONS.projects.col,
    COLLECTIONS.projects.ls,
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teamProjects, setTeamProjects] = useState<SharedProject[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => subscribeProfile(setProfile), []);

  const isTeamUser = profile?.companyId && (profile.tier === 'pro' || profile.tier === 'business');

  useEffect(() => {
    if (!isTeamUser || !profile?.companyId) {
      setTeamProjects([]); setMembers([]); setCompany(null);
      return;
    }
    const u1 = subscribeTeamProjects(profile.companyId, setTeamProjects);
    const u2 = subscribeCompany(profile.companyId, setCompany);
    const u3 = subscribeMembers(profile.companyId, setMembers);
    return () => { u1(); u2(); u3(); };
  }, [isTeamUser, profile?.companyId]);

  // Wrap save to auto-tag projects with team-sharing fields when applicable.
  const saveProject = useCallback((project: ProjectRecord) => {
    const isTeamUser = profile?.companyId && (profile?.tier === 'pro' || profile?.tier === 'business');
    const tagged: ProjectRecord = {
      ...project,
      ownerUid: project.ownerUid || auth?.currentUser?.uid || undefined,
      ownerEmail: project.ownerEmail || auth?.currentUser?.email || undefined,
      companyId: isTeamUser ? profile!.companyId : project.companyId,
      // Default visibility: 'team' for company members (so the project appears
      // in the Company tab), 'private' for solo users. Preserve any existing choice.
      visibility: project.visibility ?? (isTeamUser ? 'team' : 'private'),
    };
    rawSaveProject(tagged);
  }, [profile, rawSaveProject]);


  const [projectName, setProjectName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('New Construction');
  const [predictedEndDate, setPredictedEndDate] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((p) =>
      [p.name, p.projectNumber, p.client, p.location, p.status, p.projectType]
        .join(' ').toLowerCase().includes(query),
    );
  }, [projects, searchText]);

  const filteredTeamProjects = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return teamProjects;
    return teamProjects.filter((p) =>
      [p.name, p.projectNumber, p.client, p.location, p.status, p.projectType, p.ownerEmail]
        .join(' ').toLowerCase().includes(query),
    );
  }, [teamProjects, searchText]);

  const openProject = (project: ProjectRecord) => {
    const updated = { ...project, updatedAt: new Date().toISOString() };
    saveProject(updated);
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, updated.id);
    window.localStorage.setItem(SESSION_MODE_KEY, 'project');
    navigate('/dashboard');
  };

  const deleteProject = (projectId: string) => {
    removeProject(projectId);
    if (window.localStorage.getItem(ACTIVE_PROJECT_KEY) === projectId)
      window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
  };

  const createProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    const now = new Date().toISOString();
    const project: ProjectRecord = {
      id: makeProjectId(),
      name: projectName.trim(),
      projectNumber: projectNumber.trim() || `P-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`,
      client: client.trim(),
      location: location.trim(),
      description: description.trim(),
      status: 'Active',
      projectType,
      createdAt: now,
      updatedAt: now,
      predictedEndDate: predictedEndDate || '',
      colorIndex: projects.length,
    };
    saveProject(project);
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
    window.localStorage.setItem(SESSION_MODE_KEY, 'project');
    setShowNewModal(false);
    setProjectName(''); setProjectNumber(''); setClient(''); setLocation('');
    setDescription(''); setProjectType('New Construction'); setPredictedEndDate('');
    navigate('/dashboard');
  };

  const openProjectSettings = (project: ProjectRecord) => {
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
    window.localStorage.setItem(SESSION_MODE_KEY, 'project');
    navigate('/project-settings');
  };

  const openTeamProject = (project: SharedProject) => {
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
    window.localStorage.setItem(SESSION_MODE_KEY, 'project');
    navigate('/dashboard');
  };

  const startQuickCalculations = () => {
    window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
    window.localStorage.setItem(SESSION_MODE_KEY, 'quick');
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded px-2.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500';
  const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1';

  const closeModal = () => {
    setShowNewModal(false);
    setProjectName(''); setProjectNumber(''); setClient(''); setLocation('');
    setDescription(''); setProjectType('New Construction'); setPredictedEndDate('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col select-none">

      {/* ── Topbar ── */}
      <div className="flex items-center justify-between px-4 bg-slate-950 border-b border-slate-800 shrink-0 h-11">
        <div className="flex items-center gap-3">
          <BrandMark variant="wordmark" size={26} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Projects</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">{user?.email}</span>
          <button
            onClick={startQuickCalculations}
            className="flex items-center gap-1.5 px-3 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
          >
            <Calculator size={12} /> Quick Calc
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-7 flex flex-col gap-6">

          {/* ── Page header ── */}
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-[40px] tracking-tight text-slate-100 italic leading-none" style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 }}>
                Projects
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {projects.filter(p => p.status === 'Active').length} active · {projects.filter(p => p.status === 'Archived' || p.status === 'Closed').length} archived
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                <input value={searchText} onChange={(e) => setSearchText(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 w-44"
                  placeholder="Search" />
              </div>
              <button onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
                <Plus size={12} /> New project
              </button>
            </div>
          </div>

          {/* ── My projects ── */}
          <ProjectGroup label={isTeamUser ? 'My projects' : 'All projects'} count={filteredProjects.length}>
            {filteredProjects.length === 0 ? (
              <EmptyRow message={projects.length === 0 ? 'No saved projects yet. Create one to get started.' : 'No projects match your search.'} />
            ) : (
              filteredProjects.map(project => {
                const colorIdx = project.colorIndex !== undefined ? project.colorIndex : stableIndexForId(project.id);
                const chipColor = colorForProject(colorIdx).hex;
                const metaParts = [
                  project.projectNumber,
                  project.client,
                  project.location,
                ].filter(Boolean);
                const isMenuOpen = openMenuId === project.id;
                return (
                  <div key={project.id} className="grid grid-cols-[10px_1fr_auto_18px] gap-3 items-center px-4 py-3 border-b border-slate-900/60 last:border-0 hover:bg-slate-700/30 transition-colors">
                    <button onClick={() => openProject(project)} className="w-2 h-2 rounded-sm shrink-0" style={{ background: chipColor }} aria-label={`Open ${project.name}`} />
                    <button onClick={() => openProject(project)} className="min-w-0 text-left">
                      <div className="text-sm text-slate-200 truncate group-hover:text-white">{project.name}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {metaParts.length > 0 ? metaParts.join(' · ') : 'No details'}
                      </div>
                    </button>
                    <span className="text-[11px] text-slate-500 shrink-0 hidden sm:block">{formatDateTime(project.updatedAt)}</span>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(isMenuOpen ? null : project.id)}
                        className="text-slate-500 hover:text-slate-200 transition-colors"
                        aria-label="Actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 top-6 z-20 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1">
                            <button onClick={() => { setOpenMenuId(null); openProject(project); }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors">
                              Open
                            </button>
                            <button onClick={() => { setOpenMenuId(null); openProjectSettings(project); }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2">
                              <SettingsIcon size={11} /> Edit details
                            </button>
                            <div className="my-1 border-t border-slate-700" />
                            <button onClick={() => { setOpenMenuId(null); deleteProject(project.id); }}
                              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-slate-700 transition-colors flex items-center gap-2">
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </ProjectGroup>

          {/* ── Team projects (Pro/Business + company members) ── */}
          {isTeamUser && (
            <ProjectGroup
              label={company?.name || 'Team'}
              count={filteredTeamProjects.length}
              shared
              meta={`${filteredTeamProjects.length} project${filteredTeamProjects.length === 1 ? '' : 's'} · ${members.length} member${members.length === 1 ? '' : 's'}`}
              action={{ label: 'Manage team', onClick: () => navigate('/settings?tab=team') }}
            >
              {filteredTeamProjects.length === 0 ? (
                <EmptyRow message={teamProjects.length === 0
                  ? 'No team projects yet. Projects marked "Team" by your teammates appear here.'
                  : 'No team projects match your search.'} />
              ) : (
                filteredTeamProjects.map(project => {
                  const colorIdx = project.colorIndex !== undefined ? project.colorIndex : stableIndexForId(project.id);
                  const chipColor = colorForProject(colorIdx).hex;
                  const metaParts = [project.projectNumber, project.client, project.location].filter(Boolean);
                  const owner = members.find(m => m.uid === project.ownerUid) || { email: project.ownerEmail, name: '' };
                  const ownerInitial = (owner?.name || owner?.email || '?').slice(0, 1).toUpperCase();
                  const ownerColor = colorForProject(stableIndexForId(project.ownerUid || project.id)).hex;
                  return (
                    <div key={project.id} className="grid grid-cols-[10px_1fr_auto_auto_18px] gap-3 items-center px-4 py-3 border-b border-slate-900/60 last:border-0 hover:bg-slate-700/30 transition-colors">
                      <button onClick={() => openTeamProject(project)} className="w-2 h-2 rounded-sm shrink-0" style={{ background: chipColor }} aria-label={`Open ${project.name}`} />
                      <button onClick={() => openTeamProject(project)} className="min-w-0 text-left">
                        <div className="text-sm text-slate-200 truncate">{project.name}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {metaParts.length > 0 ? metaParts.join(' · ') : 'No details'}
                        </div>
                      </button>
                      <div className="flex shrink-0" title={`Owner: ${project.ownerEmail || 'unknown'}`}>
                        <div className="w-5 h-5 rounded-full border-[1.5px] border-slate-800 flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: ownerColor }}>
                          {ownerInitial}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0 hidden sm:block">{formatDateTime(project.updatedAt)}</span>
                      <span className="text-slate-500"><Users size={14} /></span>
                    </div>
                  );
                })
              )}
            </ProjectGroup>
          )}

        </div>
      </div>


      {/* ── New project modal ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/40">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-blue-400" />
                <span className="text-xs font-semibold text-slate-200">New project</span>
                <span className="text-[10px] text-slate-500 ml-1">— enter basic details, refine later</span>
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={createProject}>
              <div className="p-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Project Name *</label>
                  <input autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)}
                    className={inputCls} placeholder="Office Building Framing" required />
                </div>
                <div>
                  <label className={labelCls}>Project Number</label>
                  <input value={projectNumber} onChange={(e) => setProjectNumber(e.target.value)}
                    className={inputCls} placeholder="Auto-filled if blank" />
                </div>
                <div>
                  <label className={labelCls}>Client</label>
                  <input value={client} onChange={(e) => setClient(e.target.value)}
                    className={inputCls} placeholder="Client name" />
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)}
                    className={inputCls} placeholder="City, State" />
                </div>
                <div>
                  <label className={labelCls}>Predicted End Date</label>
                  <input type="date" value={predictedEndDate} onChange={(e) => setPredictedEndDate(e.target.value)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Project Type</label>
                  <select value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                    <option>New Construction</option><option>Renovation</option><option>Inspection</option><option>Mixed</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Notes / Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 min-h-16 resize-none"
                    placeholder="Optional project notes" />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-700 bg-slate-900/40">
                <button type="button" onClick={closeModal}
                  className="px-4 py-1.5 text-slate-400 hover:text-white text-xs transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!projectName.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <Save size={12} /> Save &amp; Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
