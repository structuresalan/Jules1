import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calculator, Clock3, FileText, FolderOpen, LogOut, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../hooks/useAuth';
import { colorForProject, stableIndexForId } from '../lib/projectColors';
import { useCollection } from '../lib/useCollection';
import { COLLECTIONS } from '../lib/db';
import { subscribeProfile, type UserProfile } from '../lib/userProfile';
import { auth } from '../firebase';

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

const statusBadgeClass = (status: ProjectStatus) => {
  switch (status) {
    case 'Active':   return 'bg-green-900/40 text-green-400 border border-green-800/50';
    case 'On Hold':  return 'bg-amber-900/40 text-amber-400 border border-amber-800/50';
    case 'Closed':
    case 'Archived':
    default:         return 'bg-slate-700 text-slate-400 border border-slate-600';
  }
};

export const ProjectHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { items: projects, save: rawSaveProject, remove: removeProject } = useCollection<ProjectRecord>(
    COLLECTIONS.projects.col,
    COLLECTIONS.projects.ls,
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => subscribeProfile(setProfile), []);

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
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectNumber, setEditProjectNumber] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('Active');
  const [editPredictedEndDate, setEditPredictedEndDate] = useState('');

  const filteredProjects = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((p) =>
      [p.name, p.projectNumber, p.client, p.location, p.status, p.projectType]
        .join(' ').toLowerCase().includes(query),
    );
  }, [projects, searchText]);

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

  const startEditProject = (project: ProjectRecord) => {
    setEditingProjectId(project.id);
    setEditProjectNumber(project.projectNumber);
    setEditStatus(project.status);
    setEditPredictedEndDate(project.predictedEndDate || '');
  };

  const cancelEditProject = () => {
    setEditingProjectId(null);
    setEditProjectNumber('');
    setEditStatus('Active');
    setEditPredictedEndDate('');
  };

  const saveProjectEdit = (projectId: string) => {
    const existing = projects.find(p => p.id === projectId);
    if (existing) {
      saveProject({
        ...existing,
        projectNumber: editProjectNumber.trim() || existing.projectNumber,
        status: editStatus,
        predictedEndDate: editStatus === 'Active' ? editPredictedEndDate : '',
        updatedAt: new Date().toISOString(),
      });
    }
    cancelEditProject();
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-6 py-6 flex flex-col gap-4 h-full">

          {/* ── Projects table ── */}
          <div className="bg-slate-800 border border-slate-700 rounded overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/40 shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen size={13} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-200">Projects</span>
                <span className="text-[10px] text-slate-500">{filteredProjects.length} shown</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                  <input value={searchText} onChange={(e) => setSearchText(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded pl-7 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 w-52"
                    placeholder="Search projects…" />
                </div>
                <button onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
                  <Plus size={11} /> New Project
                </button>
              </div>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full min-w-[980px] text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-700">
                    {['Name', 'Project No.', 'Client', 'Location', 'Type', 'Status', 'Predicted End', 'Created', 'Last Modified', ''].map((h) => (
                      <th key={h} className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider ${h === '' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                          <FolderOpen size={24} className="mx-auto mb-2 text-slate-700" />
                          {projects.length === 0 ? 'No saved projects yet. Create a new project to get started.' : 'No projects match your search.'}
                        </td>
                      </tr>
                    ) : filteredProjects.map((project) => {
                      const colorIdx = project.colorIndex !== undefined ? project.colorIndex : stableIndexForId(project.id);
                      const chipColor = colorForProject(colorIdx).hex;
                      return (
                      <tr key={project.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <td className="py-2.5 pl-0 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-[3px] self-stretch min-h-[28px] rounded-full shrink-0" style={{ background: chipColor }} />
                            <div>
                              <div className="font-medium text-slate-200">{project.name}</div>
                              {project.description && <div className="mt-0.5 max-w-xs truncate text-slate-500">{project.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {editingProjectId === project.id ? (
                            <input value={editProjectNumber} onChange={(e) => setEditProjectNumber(e.target.value)}
                              className="w-28 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500" />
                          ) : (
                            <span className="font-mono text-slate-400">{project.projectNumber}</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400">{project.client || '—'}</td>
                        <td className="px-3 py-2.5 text-slate-400">{project.location || '—'}</td>
                        <td className="px-3 py-2.5 text-slate-400">{project.projectType || '—'}</td>
                        <td className="px-3 py-2.5">
                          {editingProjectId === project.id ? (
                            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                              className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer">
                              <option>Active</option><option>On Hold</option><option>Closed</option><option>Archived</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadgeClass(project.status)}`}>
                              {project.status}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400">
                          {editingProjectId === project.id ? (
                            <input type="date" value={editPredictedEndDate}
                              onChange={(e) => setEditPredictedEndDate(e.target.value)}
                              disabled={editStatus !== 'Active'}
                              className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-40" />
                          ) : (
                            project.status === 'Active' && project.predictedEndDate ? project.predictedEndDate : '—'
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{formatDateTime(project.createdAt)}</td>
                        <td className="px-3 py-2.5 text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock3 size={11} className="text-slate-600" />
                            {formatDateTime(project.updatedAt)}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-end items-center gap-1">
                            {editingProjectId === project.id ? (
                              <>
                                <button onClick={() => saveProjectEdit(project.id)}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-green-900/30 border border-green-700/50 text-green-400 hover:bg-green-900/50 text-[10px] transition-colors">
                                  <Save size={11} /> Save
                                </button>
                                <button onClick={cancelEditProject}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-slate-400 hover:text-white text-[10px] transition-colors">
                                  <X size={11} /> Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => openProject(project)}
                                  className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium transition-colors">
                                  Open
                                </button>
                                <button onClick={() => startEditProject(project)} title="Edit"
                                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
                                  <Pencil size={12} />
                                </button>
                                <button onClick={() => deleteProject(project.id)} title="Delete"
                                  className="p-1 rounded bg-slate-700 hover:bg-red-900/40 text-slate-500 hover:text-red-400 transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </div>

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
