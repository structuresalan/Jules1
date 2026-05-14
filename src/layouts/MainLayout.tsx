import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Frame, Layers, Wind, Database, Settings, LogOut, Menu, FolderOpen, FileText, ArrowLeft, Network, ChevronDown, ChevronRight, Camera, ClipboardList, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { BrandMark } from '../components/BrandMark';

interface ProjectSummary {
  label: string;
  projectNumber: string;
  client: string;
  status: string;
  mode: 'project' | 'quick' | 'none';
}

const getProjectSummary = (): ProjectSummary => {
  try {
    const rawProjects = window.localStorage.getItem('struccalc.projects.v3');
    const activeProjectId = window.localStorage.getItem('struccalc.activeProject.v3');
    const mode = window.localStorage.getItem('struccalc.sessionMode.v3');

    if (mode === 'quick') {
      return {
        label: 'Quick Calculations',
        projectNumber: '',
        client: '',
        status: 'Temporary workspace',
        mode: 'quick',
      };
    }

    if (!rawProjects || !activeProjectId) {
      return {
        label: 'No project selected',
        projectNumber: '',
        client: '',
        status: 'Open Projects to begin',
        mode: 'none',
      };
    }

    const projects = JSON.parse(rawProjects) as Array<{
      id: string;
      name: string;
      projectNumber?: string;
      client?: string;
      status?: string;
    }>;
    const activeProject = projects.find((project) => project.id === activeProjectId);

    if (!activeProject) {
      return {
        label: 'No project selected',
        projectNumber: '',
        client: '',
        status: 'Open Projects to begin',
        mode: 'none',
      };
    }

    return {
      label: activeProject.name,
      projectNumber: activeProject.projectNumber || '',
      client: activeProject.client || '',
      status: activeProject.status || 'Active',
      mode: 'project',
    };
  } catch {
    return {
      label: 'No project selected',
      projectNumber: '',
      client: '',
      status: 'Open Projects to begin',
      mode: 'none',
    };
  }
};

export const MainLayout: React.FC = () => {
  const { user, logout, mockLogout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [projectSummary, setProjectSummary] = React.useState(getProjectSummary);

  React.useEffect(() => {
    setProjectSummary(getProjectSummary());
  }, [location.pathname]);

  const isProjectHome = location.pathname === '/';
  const isVisualWorkspace = location.pathname === '/visual-workspace';
  const [toolsExpanded, setToolsExpanded] = React.useState(true);

  const toolsPaths = ['/steel', '/concrete', '/loads', '/variables'];
  const isToolsActive = toolsPaths.some(p => location.pathname.startsWith(p));
  const isCalcPage = ['/steel', '/concrete', '/loads'].some(p => location.pathname.startsWith(p));

  React.useEffect(() => {
    if (isToolsActive) setToolsExpanded(true);
  }, [isToolsActive]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out', error);
      mockLogout();
    }
  };

  if (isProjectHome) {
    return <Outlet />;
  }

  const topNavItems = [
    { to: '/visual-workspace', icon: <Network size={18} />, label: 'Workspace' },
    { to: '/dashboard', icon: <Home size={18} />, label: 'Overview', end: true },
    { to: '/documents', icon: <FileText size={18} />, label: 'Reports' },
  ];

  const toolNavItems = [
    { to: '/steel', icon: <Frame size={18} />, label: 'Steel Design' },
    { to: '/concrete', icon: <Layers size={18} />, label: 'Concrete Design' },
    { to: '/loads', icon: <Wind size={18} />, label: 'Loads' },
    { to: '/variables', icon: <Database size={18} />, label: 'Variables' },
  ];

  const stubNavItems = [
    { icon: <MapPin size={18} />, label: 'Site Visits' },
    { icon: <ClipboardList size={18} />, label: 'Observations' },
    { icon: <Camera size={18} />, label: 'Photos' },
  ];

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

      {/* Sidebar — hidden on Visual Workspace to avoid double sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition duration-200 ease-in-out z-40 w-60 shrink-0 flex flex-col bg-slate-950 border-r border-slate-700 ${
          isVisualWorkspace ? 'hidden' : ''
        }`}
      >
        {/* Logo area */}
        <div className="px-4 py-4 border-b border-slate-700">
          <BrandMark variant="wordmark" size={28} />

          {/* Projects Home back link */}
          <NavLink
            to="/"
            end
            className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={14} />
            Projects Home
          </NavLink>

          {/* Project summary card */}
          <div className="mt-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Current Workspace</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                {projectSummary.status}
              </span>
            </div>
            <div className="text-slate-200 font-semibold truncate">{projectSummary.label}</div>
            {(projectSummary.projectNumber || projectSummary.client) && (
              <div className="mt-1 text-slate-500">
                {[projectSummary.projectNumber, projectSummary.client].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="space-y-0.5 px-2 pt-2">
            {topNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors rounded ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border-l-2 border-l-blue-500'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Collapsible Tools group */}
          <div className="mt-3 px-2">
            <button
              onClick={() => setToolsExpanded(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded transition-colors ${
                isToolsActive ? 'text-blue-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Frame size={18} />
                Tools
              </span>
              {toolsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {toolsExpanded && (
              <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2">
                {toolNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors rounded ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 border-l-2 border-l-blue-500'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Stub items */}
          <div className="mt-3 space-y-0.5 px-2">
            {stubNavItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2.5 px-4 py-2 text-sm text-slate-600 rounded cursor-not-allowed select-none"
                title="Coming soon"
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700">Soon</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-700 pt-2 px-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors rounded ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border-l-2 border-l-blue-500'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Settings size={18} />
              Settings
            </NavLink>
          </div>
        </nav>

        {/* Bottom user area */}
        <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-400 truncate max-w-[140px]">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-white transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
        {/* Slim project banner — only when not visual-workspace */}
        {!isVisualWorkspace && (
          <div className="px-6 py-3 border-b border-slate-700 bg-slate-950 flex items-center justify-between shrink-0">
            <span className="text-sm font-semibold text-slate-200">{projectSummary.label}</span>
            <NavLink
              to="/"
              end
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <FolderOpen size={14} />
              Switch Project
            </NavLink>
          </div>
        )}

        {/* Calc scoping notice */}
        {isCalcPage && (
          <div className="px-6 py-2 bg-amber-950/30 border-b border-amber-900/40 shrink-0 flex items-center gap-2">
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
