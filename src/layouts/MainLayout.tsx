import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Frame, Layers, Wind, Database, Settings, LogOut, Menu, FolderOpen, FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DisclaimerModal } from '../components/DisclaimerModal';
import simplifyStructLogo from '../assets/simplifystruct-logo.png';

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

  const navItems = [
    { to: '/dashboard', icon: <Home size={18} />, label: 'Dashboard', end: true },
    { to: '/steel', icon: <Frame size={18} />, label: 'Steel Design' },
    { to: '/concrete', icon: <Layers size={18} />, label: 'Concrete Design' },
    { to: '/loads', icon: <Wind size={18} />, label: 'Loads' },
    { to: '/documents', icon: <FileText size={18} />, label: 'Documents' },
    { to: '/variables', icon: <Database size={18} />, label: 'Variables' },
  ];

  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans relative">
      <DisclaimerModal />

      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm border"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={20} />
      </button>

      <div
        className={`fixed md:static inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition duration-200 ease-in-out z-40 w-72 bg-gray-50 border-r border-gray-200 flex flex-col`}
      >
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center">
            <img src={simplifyStructLogo} alt="SimplifyStruct logo" className="h-10 max-w-[190px] rounded-sm bg-white object-contain" />
          </div>

          <NavLink
            to="/"
            end
            className="mt-5 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            <ArrowLeft size={16} />
            Projects Home
          </NavLink>

          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Current Workspace</div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  projectSummary.mode === 'quick'
                    ? 'bg-amber-50 text-amber-700'
                    : projectSummary.mode === 'project'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {projectSummary.status}
              </span>
            </div>

            <div className="text-lg font-bold leading-tight text-gray-950 break-words">
              {projectSummary.label}
            </div>

            {(projectSummary.projectNumber || projectSummary.client) && (
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                {projectSummary.projectNumber && (
                  <div>
                    <span className="font-semibold text-gray-800">No.</span> {projectSummary.projectNumber}
                  </div>
                )}
                {projectSummary.client && (
                  <div>
                    <span className="font-semibold text-gray-800">Client</span> {projectSummary.client}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 text-xs text-gray-500">
              Use Projects Home to switch projects, create new work, or start quick calculations.
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">
            Design Workspace
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-200 text-gray-950 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">
              System
            </div>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-200 text-gray-950 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Settings size={18} />
              Settings
            </NavLink>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-gray-200">
            <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="px-1 text-[10px] text-gray-400 leading-tight">
            NOT FOR CONSTRUCTION. Engineer of Record must verify all calculations. By using this tool, you accept the Terms of Use and liability disclaimer.
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white">
        <main className="p-8 max-w-7xl mx-auto mt-10 md:mt-0">
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Active Project
            </div>
            <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-950">
                  {projectSummary.label}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {projectSummary.mode === 'quick'
                    ? 'Temporary quick-calculation workspace'
                    : projectSummary.projectNumber || projectSummary.client
                      ? [projectSummary.projectNumber, projectSummary.client].filter(Boolean).join(' • ')
                      : 'Use Projects Home to select or create a project'}
                </p>
              </div>

              <NavLink
                to="/"
                end
                className="inline-flex w-fit items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                <FolderOpen size={16} />
                Switch Project
              </NavLink>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};
