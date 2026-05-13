import React, { useMemo, useState } from 'react';
import { Calculator, Clock3, FileText, FolderOpen, LogOut, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import simplifyStructLogo from '../assets/simplifystruct-logo.png';
import { useAuth } from '../hooks/useAuth';

type ProjectStatus = 'Active' | 'On Hold' | 'Closed' | 'Archived';
type ProjectCalculationType = 'Mixed' | 'Steel' | 'Concrete' | 'Loads';

interface ProjectRecord {
  id: string;
  name: string;
  projectNumber: string;
  client: string;
  location: string;
  description: string;
  status: ProjectStatus;
  calculationType: ProjectCalculationType;
  createdAt: string;
  updatedAt: string;
  predictedEndDate?: string;
}

const STORAGE_KEY = 'struccalc.projects.v3';
const ACTIVE_PROJECT_KEY = 'struccalc.activeProject.v3';
const SESSION_MODE_KEY = 'struccalc.sessionMode.v3';

const makeProjectId = () => `project_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const readProjects = (): ProjectRecord[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProjectRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveProjects = (projects: ProjectRecord[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

const formatDateTime = (isoDate: string) => {
  if (!isoDate) return '-';

  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
};

const statusBadgeClass = (status: ProjectStatus) => {
  switch (status) {
    case 'Active':
      return 'bg-green-900/40 text-green-400 border border-green-800/50';
    case 'On Hold':
      return 'bg-amber-900/40 text-amber-400 border border-amber-800/50';
    case 'Closed':
    case 'Archived':
    default:
      return 'bg-slate-700 text-slate-400 border border-slate-600';
  }
};

export const ProjectHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>(readProjects);
  const [selectedMode, setSelectedMode] = useState<'new' | 'existing'>('new');
  const [searchText, setSearchText] = useState('');

  const [projectName, setProjectName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [calculationType, setCalculationType] = useState<ProjectCalculationType>('Mixed');
  const [predictedEndDate, setPredictedEndDate] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectNumber, setEditProjectNumber] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('Active');
  const [editPredictedEndDate, setEditPredictedEndDate] = useState('');

  const filteredProjects = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return projects;

    return projects.filter((project) => {
      const searchableText = [
        project.name,
        project.projectNumber,
        project.client,
        project.location,
        project.status,
        project.calculationType,
      ].join(' ').toLowerCase();

      return searchableText.includes(query);
    });
  }, [projects, searchText]);

  const storeProjects = (nextProjects: ProjectRecord[]) => {
    setProjects(nextProjects);
    saveProjects(nextProjects);
  };

  const openProject = (project: ProjectRecord) => {
    const updatedProject = { ...project, updatedAt: new Date().toISOString() };
    const nextProjects = projects.map((item) => (item.id === project.id ? updatedProject : item));
    storeProjects(nextProjects);
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, updatedProject.id);
    window.localStorage.setItem(SESSION_MODE_KEY, 'project');
    navigate('/dashboard');
  };

  const deleteProject = (projectId: string) => {
    const nextProjects = projects.filter((project) => project.id !== projectId);
    storeProjects(nextProjects);

    if (window.localStorage.getItem(ACTIVE_PROJECT_KEY) === projectId) {
      window.localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  };

  const createProject = (event: React.FormEvent) => {
    event.preventDefault();
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
      calculationType,
      createdAt: now,
      updatedAt: now,
      predictedEndDate: predictedEndDate || '',
    };

    storeProjects([project, ...projects]);
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
    window.localStorage.setItem(SESSION_MODE_KEY, 'project');
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
    const nextProjects = projects.map((project) => {
      if (project.id !== projectId) return project;

      return {
        ...project,
        projectNumber: editProjectNumber.trim() || project.projectNumber,
        status: editStatus,
        predictedEndDate: editStatus === 'Active' ? editPredictedEndDate : '',
        updatedAt: new Date().toISOString(),
      };
    });

    storeProjects(nextProjects);
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

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600';

  const labelClass = 'block text-xs text-slate-400 mb-1 uppercase tracking-wide';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-200 font-sans">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
        <img src={simplifyStructLogo} alt="SimplifyStruct logo" className="h-8 rounded bg-white/90 object-contain px-1" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{user?.email}</span>
          <button
            onClick={startQuickCalculations}
            className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300 rounded px-3 py-1.5 transition-colors"
            title="Quick Calculations"
          >
            <Calculator size={13} />
            Quick Calc
          </button>
          <button
            onClick={handleSignOut}
            className="text-slate-500 hover:text-white text-xs flex items-center gap-1 transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content: two columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: project form */}
        <div className="w-96 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
          {/* Mode tabs */}
          <div className="px-5 py-4 border-b border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Workspace</div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMode('new')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedMode === 'new'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-700/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Plus size={12} />
                New Project
              </button>
              <button
                onClick={() => setSelectedMode('existing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedMode === 'existing'
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-700/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700'
                }`}
              >
                <FolderOpen size={12} />
                Open Existing
              </button>
            </div>
          </div>

          {/* Form content */}
          {selectedMode === 'new' && (
            <form onSubmit={createProject} className="flex flex-col flex-1 px-5 py-4 gap-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={15} className="text-blue-400" />
                <span className="text-sm font-semibold text-slate-200">Create New Project</span>
              </div>

              <div>
                <label className={labelClass}>Project Name *</label>
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  className={inputClass}
                  placeholder="Office Building Framing"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Project Number</label>
                <input
                  value={projectNumber}
                  onChange={(event) => setProjectNumber(event.target.value)}
                  className={inputClass}
                  placeholder="Auto-filled if blank"
                />
              </div>

              <div>
                <label className={labelClass}>Client</label>
                <input
                  value={client}
                  onChange={(event) => setClient(event.target.value)}
                  className={inputClass}
                  placeholder="Client name"
                />
              </div>

              <div>
                <label className={labelClass}>Location</label>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className={inputClass}
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className={labelClass}>Predicted End Date</label>
                <input
                  type="date"
                  value={predictedEndDate}
                  onChange={(event) => setPredictedEndDate(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Calculation Focus</label>
                <select
                  value={calculationType}
                  onChange={(event) => setCalculationType(event.target.value as ProjectCalculationType)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option>Mixed</option>
                  <option>Steel</option>
                  <option>Concrete</option>
                  <option>Loads</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Notes / Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600 min-h-20 resize-none"
                  placeholder="Optional project notes"
                />
              </div>

              <button
                type="submit"
                disabled={!projectName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
              >
                Save Project &amp; Open
              </button>
            </form>
          )}

          {selectedMode === 'existing' && (
            <div className="flex flex-col flex-1 px-5 py-4">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen size={15} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-200">Open Existing Project</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Select a project from the list on the right to open it.</p>
              <button
                onClick={() => setSelectedMode('new')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors mt-auto"
              >
                + New Project
              </button>
            </div>
          )}
        </div>

        {/* Right: project list */}
        <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="px-5 py-3 border-b border-slate-800 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-600"
                placeholder="Search projects..."
              />
            </div>
          </div>

          {/* Project cards */}
          <div className="flex-1 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                <FolderOpen size={32} className="text-slate-700" />
                <p className="text-sm">
                  {projects.length === 0
                    ? 'No saved projects yet. Create a new project to get started.'
                    : 'No projects match your search.'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="mx-4 my-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
                  >
                    {editingProjectId === project.id ? (
                      /* Edit mode */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-200">{project.name}</span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => saveProjectEdit(project.id)}
                              className="flex items-center gap-1 bg-green-800/40 border border-green-700/50 text-green-400 hover:bg-green-800/60 rounded px-2 py-1 text-xs transition-colors"
                              title="Save changes"
                            >
                              <Save size={12} /> Save
                            </button>
                            <button
                              onClick={cancelEditProject}
                              className="flex items-center gap-1 bg-slate-700 border border-slate-600 text-slate-400 hover:text-white rounded px-2 py-1 text-xs transition-colors"
                              title="Cancel editing"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Project No.</label>
                            <input
                              value={editProjectNumber}
                              onChange={(event) => setEditProjectNumber(event.target.value)}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Status</label>
                            <select
                              value={editStatus}
                              onChange={(event) => setEditStatus(event.target.value as ProjectStatus)}
                              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                              <option>Active</option>
                              <option>On Hold</option>
                              <option>Closed</option>
                              <option>Archived</option>
                            </select>
                          </div>
                          {editStatus === 'Active' && (
                            <div className="col-span-2">
                              <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Predicted End Date</label>
                              <input
                                type="date"
                                value={editPredictedEndDate}
                                onChange={(event) => setEditPredictedEndDate(event.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-slate-200 truncate">{project.name}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusBadgeClass(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {[project.projectNumber, project.client].filter(Boolean).join(' · ')}
                            {project.location ? ` — ${project.location}` : ''}
                          </div>
                          {project.description && (
                            <div className="mt-1 text-xs text-slate-600 truncate">{project.description}</div>
                          )}
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-600">
                            <Clock3 size={10} />
                            {formatDateTime(project.updatedAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openProject(project)}
                            className="bg-blue-600 hover:bg-blue-500 text-white rounded px-3 py-1.5 text-xs font-medium transition-colors"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => startEditProject(project)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white rounded p-1.5 transition-colors"
                            title="Edit project"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="bg-slate-700 hover:bg-red-900/40 text-slate-500 hover:text-red-400 rounded p-1.5 transition-colors"
                            title="Delete project"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer count */}
          <div className="px-5 py-2.5 border-t border-slate-800 shrink-0 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'} shown
            </span>
            <span className="text-[10px] text-slate-700 uppercase tracking-wider">SimplifyStruct</span>
          </div>
        </div>
      </div>
    </div>
  );
};
