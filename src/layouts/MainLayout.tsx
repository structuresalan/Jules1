import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Frame, Layers, Wind, Database, Settings, LogOut, Menu,
  Network, FileText, ChevronRight, ChevronDown, ChevronUp, Camera,
  ClipboardList, MapPin, FolderOpen, Inbox, BookOpen, SlidersHorizontal,
  Search, Plus,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { BrandMark } from '../components/BrandMark';
import { colorForProject, initialFor, projectColorVars, stableIndexForId } from '../lib/projectColors';

interface StoredProject {
  id: string;
  name: string;
  projectNumber?: string;
  client?: string;
  location?: string;
  colorIndex?: number;
}

interface ProjectSummary {
  label: string;
  projectNumber: string;
  client: string;
  location: string;
  mode: 'project' | 'quick' | 'none';
  colorIndex: number;
  activeId: string;
}

const readAllProjects = (): StoredProject[] => {
  try {
    const raw = window.localStorage.getItem('struccalc.projects.v3');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const getProjectSummary = (): ProjectSummary => {
  try {
    const rawProjects = window.localStorage.getItem('struccalc.projects.v3');
    const activeProjectId = window.localStorage.getItem('struccalc.activeProject.v3');
    const mode = window.localStorage.getItem('struccalc.sessionMode.v3');

    if (mode === 'quick') {
      return { label: 'Quick Calculations', projectNumber: '', client: '', location: '', mode: 'quick', colorIndex: 0, activeId: '' };
    }

    if (!rawProjects || !activeProjectId) {
      return { label: 'No project selected', projectNumber: '', client: '', location: '', mode: 'none', colorIndex: 0, activeId: '' };
    }

    const parsed = JSON.parse(rawProjects);
    const projects: StoredProject[] = Array.isArray(parsed) ? parsed : [];
    const p = projects.find((project) => project.id === activeProjectId);
    if (!p) return { label: 'No project selected', projectNumber: '', client: '', location: '', mode: 'none', colorIndex: 0, activeId: '' };

    const colorIndex = p.colorIndex !== undefined ? p.colorIndex : stableIndexForId(p.id);

    return {
      label: p.name,
      projectNumber: p.projectNumber || '',
      client: p.client || '',
      location: p.location || '',
      mode: 'project',
      colorIndex,
      activeId: activeProjectId,
    };
  } catch {
    return { label: 'No project selected', projectNumber: '', client: '', location: '', mode: 'none', colorIndex: 0, activeId: '' };
  }
};

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-3 py-2 text-sm transition-colors rounded-lg ${
    isActive
      ? 'bg-blue-600/15 text-blue-300 border-l-2 border-l-blue-500 pl-2.5'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }`;

export const MainLayout: React.FC = () => {
  const { user, logout, mockLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [projectSummary, setProjectSummary] = React.useState(getProjectSummary);
  const [toolsExpanded, setToolsExpanded] = React.useState(false);
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const [switcherSearch, setSwitcherSearch] = React.useState('');
  const [allProjects, setAllProjects] = React.useState<StoredProject[]>(readAllProjects);
  const switcherContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setProjectSummary(getProjectSummary());
    setAllProjects(readAllProjects());
  }, [location.pathname]);

  React.useEffect(() => {
    if (!switcherOpen) return;
    const handler = (e: MouseEvent) => {
      if (switcherContainerRef.current && !switcherContainerRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
        setSwitcherSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [switcherOpen]);

  const isProjectHome = location.pathname === '/';
  const isVisualWorkspace = location.pathname === '/visual-workspace';

  const toolsPaths = ['/steel', '/concrete', '/loads', '/variables'];
  const isToolsActive = toolsPaths.some(p => location.pathname.startsWith(p));

  React.useEffect(() => {
    if (isToolsActive) setToolsExpanded(true);
  }, [isToolsActive]);

  const isCalcPage = ['/steel', '/concrete', '/loads'].some(p => location.pathname.startsWith(p));

  const handleLogout = async () => {
    try { await logout(); } catch { mockLogout(); }
  };

  const switchToProject = (id: string) => {
    window.localStorage.setItem('struccalc.activeProject.v3', id);
    window.localStorage.setItem('struccalc.sessionMode.v3', 'project');
    setSwitcherOpen(false);
    setSwitcherSearch('');
    setProjectSummary(getProjectSummary());
    navigate('/dashboard');
  };

  if (isProjectHome) return <Outlet />;

  const colorVars = projectSummary.mode === 'project'
    ? projectColorVars(colorForProject(projectSummary.colorIndex))
    : {};

  const chipInitial = projectSummary.mode === 'project' ? initialFor(projectSummary.label) : '?';

  const switcherFiltered = switcherSearch.trim()
    ? allProjects.filter(p => p.name.toLowerCase().includes(switcherSearch.toLowerCase()))
    : allProjects;

  return (
    <div
      className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden"
      style={colorVars as React.CSSProperties}
    >
      <DisclaimerModal />

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-slate-800 border border-slate-700 text-slate-300"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition duration-200 ease-in-out z-40 w-56 shrink-0 flex flex-col bg-slate-950 border-r border-slate-800 ${
          isVisualWorkspace ? 'hidden' : ''
        }`}
      >
        {/* Logo */}
        <div className="px-4 py-3.5 border-b border-slate-800">
          <BrandMark variant="wordmark" size={26} />
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">

          {/* APP section */}
          <div className="px-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-600 font-mono">App</div>

          <NavLink to="/" end className={navLinkCls}>
            <FolderOpen size={16} />
            Projects
          </NavLink>
          <NavLink to="/inbox" className={navLinkCls}>
            <Inbox size={16} />
            Inbox
          </NavLink>
          <NavLink to="/library" className={navLinkCls}>
            <BookOpen size={16} />
            Library
          </NavLink>

          {/* Color chip — project switcher */}
          {projectSummary.mode === 'project' && (
            <>
              <div className="px-2 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-600 font-mono">Current project</div>
              <div ref={switcherContainerRef} className="relative mx-1 mb-1">
                <button
                  onClick={() => setSwitcherOpen(v => !v)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-full transition-all"
                  style={{
                    background: switcherOpen
                      ? 'var(--chip-bg-hover, rgba(100,116,139,0.18))'
                      : 'var(--chip-bg, rgba(100,116,139,0.12))',
                    border: '0.5px solid',
                    borderColor: switcherOpen
                      ? 'var(--chip-border-active, rgba(100,116,139,0.5))'
                      : 'var(--chip-border, rgba(100,116,139,0.3))',
                    boxShadow: switcherOpen
                      ? '0 0 0 2px var(--chip-glow, rgba(100,116,139,0.12))'
                      : 'none',
                  }}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] font-bold text-white font-mono shrink-0"
                    style={{ background: 'var(--chip-color, #64748b)' }}
                  >
                    {chipInitial}
                  </div>
                  <span className="flex-1 text-left text-xs font-medium text-slate-200 truncate">
                    {projectSummary.label}
                  </span>
                  {switcherOpen
                    ? <ChevronUp size={12} className="shrink-0" style={{ color: 'var(--chip-color, #64748b)' }} />
                    : <ChevronDown size={12} className="shrink-0 text-slate-500" />}
                </button>

                {/* Switcher dropdown */}
                {switcherOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-800 border border-slate-600/60 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-700">
                      <Search size={11} className="text-slate-500 shrink-0" />
                      <input
                        autoFocus
                        value={switcherSearch}
                        onChange={e => setSwitcherSearch(e.target.value)}
                        placeholder="Find project..."
                        className="flex-1 bg-transparent border-none outline-none text-xs text-slate-200 placeholder-slate-600"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                      {switcherFiltered.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-slate-600">No projects found</div>
                      ) : switcherFiltered.map(p => {
                        const pColorIdx = p.colorIndex !== undefined ? p.colorIndex : stableIndexForId(p.id);
                        const pColor = colorForProject(pColorIdx);
                        const pInitial = initialFor(p.name);
                        const isActive = p.id === projectSummary.activeId;
                        return (
                          <button
                            key={p.id}
                            onClick={() => switchToProject(p.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isActive ? 'bg-slate-700/50' : 'hover:bg-slate-700/40'}`}
                          >
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white font-mono shrink-0"
                              style={{ background: pColor.hex }}
                            >
                              {pInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-slate-200 truncate">{p.name}</div>
                              {p.projectNumber && <div className="text-[10px] text-slate-500 font-mono">{p.projectNumber}</div>}
                            </div>
                            {isActive && (
                              <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--chip-color)' }}>
                                active
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-slate-700 py-1">
                      <button
                        onClick={() => { setSwitcherOpen(false); navigate('/'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-slate-700/40 transition-colors"
                      >
                        <Plus size={12} /> New project
                      </button>
                      <button
                        onClick={() => { setSwitcherOpen(false); navigate('/'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:bg-slate-700/40 transition-colors"
                      >
                        <FolderOpen size={12} /> Browse all projects
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {projectSummary.mode !== 'project' && (
            <div className="mx-1 my-2">
              <NavLink
                to="/"
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <FolderOpen size={13} />
                Open a project
              </NavLink>
            </div>
          )}

          {/* PROJECT nav */}
          {projectSummary.mode === 'project' && (
            <>
              <NavLink to="/dashboard" end className={navLinkCls}>
                <Home size={16} />
                Project home
              </NavLink>
              <NavLink to="/visual-workspace" className={navLinkCls}>
                <Network size={16} />
                Workspace
              </NavLink>
              <NavLink to="/observations" className={navLinkCls}>
                <ClipboardList size={16} />
                Observations
              </NavLink>
              <NavLink to="/site-visits" className={navLinkCls}>
                <MapPin size={16} />
                Site visits
              </NavLink>
              <NavLink to="/photos" className={navLinkCls}>
                <Camera size={16} />
                Photos
              </NavLink>
              <NavLink to="/documents" className={navLinkCls}>
                <FileText size={16} />
                Reports
              </NavLink>

              {/* Tools — collapsible */}
              <button
                onClick={() => setToolsExpanded(v => !v)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isToolsActive ? 'text-blue-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ChevronRight size={14} className={`transition-transform ${toolsExpanded ? 'rotate-90' : ''}`} />
                <Frame size={16} />
                Tools
              </button>
              {toolsExpanded && (
                <div className="ml-5 border-l border-slate-700/60 pl-2 space-y-0.5">
                  <NavLink to="/steel" className={navLinkCls}><Frame size={14} />Steel Design</NavLink>
                  <NavLink to="/concrete" className={navLinkCls}><Layers size={14} />Concrete Design</NavLink>
                  <NavLink to="/loads" className={navLinkCls}><Wind size={14} />Loads</NavLink>
                  <NavLink to="/variables" className={navLinkCls}><Database size={14} />Variables</NavLink>
                </div>
              )}

              <NavLink to="/project-settings" className={navLinkCls}>
                <SlidersHorizontal size={16} />
                Project settings
              </NavLink>
            </>
          )}

          {/* When no project open, show just Workspace so app isn't empty */}
          {projectSummary.mode !== 'project' && (
            <>
              <NavLink to="/visual-workspace" className={navLinkCls}>
                <Network size={16} />
                Workspace
              </NavLink>
              <NavLink to="/documents" className={navLinkCls}>
                <FileText size={16} />
                Reports
              </NavLink>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 px-2 py-2 space-y-0.5">
          <NavLink to="/settings" className={navLinkCls}>
            <Settings size={16} />
            Settings
          </NavLink>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-slate-600 truncate max-w-[120px]">{user?.email}</span>
            <button onClick={handleLogout} className="text-slate-600 hover:text-white transition-colors" title="Log out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">

        {/* Topbar with breadcrumb */}
        {!isVisualWorkspace && (
          <div className="h-11 px-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 uppercase tracking-wide">
              <NavLink to="/" className="hover:text-slate-300 transition-colors">Projects</NavLink>
              {projectSummary.mode === 'project' && (
                <>
                  <ChevronRight size={12} className="text-slate-700" />
                  <div
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: 'var(--chip-color, #64748b)' }}
                  />
                  <span className="text-slate-400">{projectSummary.label}</span>
                </>
              )}
            </div>
            <NavLink
              to="/"
              className="text-xs text-slate-500 hover:text-white transition-colors border border-slate-700 rounded-md px-2.5 py-1 hover:bg-slate-800"
            >
              Switch project
            </NavLink>
          </div>
        )}

        {/* Calc scoping notice */}
        {isCalcPage && (
          <div className="px-5 py-1.5 bg-amber-950/30 border-b border-amber-900/40 shrink-0 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Project-scoped</span>
            <span className="text-xs text-amber-700">Calculations are saved to the current project.</span>
          </div>
        )}

        {/* Content */}
        {isVisualWorkspace ? (
          <div className="flex-1 overflow-hidden p-0 h-full">
            <Outlet />
          </div>
        ) : (
          <div className="flex-1 overflow-auto px-6 py-6">
            <Outlet />
          </div>
        )}
      </div>
    </div>
  );
};
