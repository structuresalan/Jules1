import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Home, Frame, Layers, Wind, Database, Settings, LogOut, Menu,
  Network, FileText, ArrowLeft, ChevronRight, Camera, ClipboardList,
  MapPin, FolderOpen, Inbox, BookOpen, SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { BrandMark } from '../components/BrandMark';

interface ProjectSummary {
  label: string;
  projectNumber: string;
  client: string;
  location: string;
  mode: 'project' | 'quick' | 'none';
}

const getProjectSummary = (): ProjectSummary => {
  try {
    const rawProjects = window.localStorage.getItem('struccalc.projects.v3');
    const activeProjectId = window.localStorage.getItem('struccalc.activeProject.v3');
    const mode = window.localStorage.getItem('struccalc.sessionMode.v3');

    if (mode === 'quick') {
      return { label: 'Quick Calculations', projectNumber: '', client: '', location: '', mode: 'quick' };
    }

    if (!rawProjects || !activeProjectId) {
      return { label: 'No project selected', projectNumber: '', client: '', location: '', mode: 'none' };
    }

    const projects = JSON.parse(rawProjects) as Array<{
      id: string; name: string; projectNumber?: string; client?: string; location?: string;
    }>;
    const p = projects.find((project) => project.id === activeProjectId);
    if (!p) return { label: 'No project selected', projectNumber: '', client: '', location: '', mode: 'none' };

    return {
      label: p.name,
      projectNumber: p.projectNumber || '',
      client: p.client || '',
      location: p.location || '',
      mode: 'project',
    };
  } catch {
    return { label: 'No project selected', projectNumber: '', client: '', location: '', mode: 'none' };
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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [projectSummary, setProjectSummary] = React.useState(getProjectSummary);
  const [toolsExpanded, setToolsExpanded] = React.useState(false);

  React.useEffect(() => {
    setProjectSummary(getProjectSummary());
  }, [location.pathname]);

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

  if (isProjectHome) return <Outlet />;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
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

          {/* Current project card */}
          {projectSummary.mode === 'project' && (
            <>
              <div className="px-2 pt-4 pb-1 text-[9px] font-bold uppercase tracking-widest text-slate-600 font-mono">Current project</div>
              <div className="mx-1 mb-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5">
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-600 font-mono mb-1">Project</div>
                <div className="text-sm font-semibold text-slate-200 truncate">{projectSummary.label}</div>
                {(projectSummary.projectNumber || projectSummary.location) && (
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                    {[projectSummary.projectNumber, projectSummary.location].filter(Boolean).join(' · ')}
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
                <ArrowLeft size={13} />
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
